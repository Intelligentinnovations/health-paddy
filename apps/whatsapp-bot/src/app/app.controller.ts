import { CustomRes } from '@backend-template/helpers';
import { Body, Controller, Get, Post, Request, Response } from '@nestjs/common';
import axios from 'axios'
import { FastifyReply } from 'fastify';

import { RequestWithQuery } from '../utils/types'
import { AppService } from './app.service';

@Controller('webhook')
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  async getData(@Request() req: RequestWithQuery, @Response() res: FastifyReply) {
    const verify_token = process.env.VERIFY_TOKEN;
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode && token) {
      if (mode === "subscribe" && token === verify_token) {
        console.log("WEBHOOK_VERIFIED");
        res.status(200).send(challenge);
      } else {
        res.status(403)
      }
    }
  }


  @Post()
  async webhook(@Request() req: RequestWithQuery, @Response() res: FastifyReply, @Body() body: any) {
    await this.appService.handleIncomingMessage(body)
    res.status(200).send("ok")
    return CustomRes.success('ok')

  }
}
