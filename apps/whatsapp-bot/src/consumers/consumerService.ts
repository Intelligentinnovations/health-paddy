import { DeleteMessageCommand, ReceiveMessageCommand, SQSClient } from "@aws-sdk/client-sqs";
import { EventType, MessageBody } from "@backend-template/types";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Inject, Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { Cache } from "cache-manager";

import { HandlePayment } from "../app/payment/payment.service";
import { ChatMessageHandler } from "./chatMessageHandler";



@Injectable()
export class ConsumerService implements OnModuleInit {
  private readonly sqsClient: SQSClient;
  private readonly queueUrl: string;
  private readonly logger = new Logger(ConsumerService.name);
  private polling = false;


  constructor(
    private handleIncomingChat: ChatMessageHandler,
    private handlePayments: HandlePayment,
    @Inject(CACHE_MANAGER) private cacheManager: Cache

  ) {
    this.queueUrl = process.env.QUEUE_URL || "";
    this.sqsClient = new SQSClient({ region: "us-east-1" });

  }


  onModuleInit() {
    this.startPolling();
  }

  private async startPolling() {
    console.log("Consumer service started")
    this.polling = true;
    while (this.polling) {
      await this.pollQueue();
    }
  }


  private async pollQueue() {
    const params = {
      QueueUrl: this.queueUrl,
      MaxNumberOfMessages: 10,
      WaitTimeSeconds: 20,
    };

    try {
      const command = new ReceiveMessageCommand(params);
      const data = await this.sqsClient.send(command);
      if (data.Messages) {
        for (const message of data.Messages) {
          const event = JSON.parse(message.Body as string) as MessageBody
          this.logger.log(`Received message: ${event.eventType}`);
          await this.processMessage(event);
          await this.deleteMessage(message.ReceiptHandle as string);
        }
      }
    } catch (error) {
      console.log({ error })
      this.logger.error("Error receiving messages", error);
    }
  }

  private async processMessage(event: MessageBody) {
    this.logger.log(`Processing message: ${event.eventType}`);
    this.logger.log(`Processing message: ${event.data}`);
    const { eventType } = event;
    switch (eventType) {
      case EventType.MESSAGE: {
        const { status, message } = await this.handleIncomingChat.handleMessages(event);
        if (status || message == "Message not sent after 3 attempts") {
          const isProcessingCacheKey = `${event.data?.phoneNumber}-is-processing`
          await this.cacheManager.del(isProcessingCacheKey)
        }
        return;
      }
      case EventType.PAYMENT:
        return this.handlePayments.handlePaystackTransaction(event.reference as string)
      default:
        break;
    }
  }


  private async deleteMessage(receiptHandle: string) {
    const params = {
      QueueUrl: this.queueUrl,
      ReceiptHandle: receiptHandle,
    };

    try {
      const command = new DeleteMessageCommand(params);
      await this.sqsClient.send(command);
      this.logger.log("Message deleted successfully");
    } catch (error) {
      this.logger.error("Error deleting message", error);
    }
  }
}
