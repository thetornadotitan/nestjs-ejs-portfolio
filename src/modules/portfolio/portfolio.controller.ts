import { Controller, Get, Render, Req } from '@nestjs/common';
import type { Request } from 'express';

@Controller()
export class PortfolioController {
  private readonly siteName = 'Isaac Hisey';
  @Get('/')
  @Render('layout')
  home(@Req() req: Request) {
    return {
      title: 'Isaac Hisey',
      message: 'Welcome to my portfolio.',
      siteName: this.siteName,
      activePath: req.path,
      page: 'pages/home',
    };
  }

  @Get('/about')
  @Render('layout')
  about(@Req() req: Request) {
    return {
      title: 'About',
      siteName: this.siteName,
      activePath: req.path,
      page: 'pages/about',
    };
  }
}
