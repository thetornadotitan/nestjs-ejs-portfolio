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
      siteName: this.siteName,
      activePath: req.path,
      page: 'pages/home',
      headCss: `<link rel="stylesheet" href="/css/stack.css" />`,
      headJs: `
        <script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js"></script>
        <script type="module" defer src="/js/stack.js"></script>
      `,
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
      headCss: ``,
      headJs: ``,
    };
  }
}
