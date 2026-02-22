import { Controller, Get, Render, Req } from '@nestjs/common';
import type { Request } from 'express';
import { GitCalendarService } from '../git-calendar/git-calendar.service';
import { ConfigService } from '@nestjs/config';

@Controller()
export class PortfolioController {
  private readonly siteName = 'Isaac Hisey';

  constructor(
    private readonly gitCal: GitCalendarService,
    private readonly config: ConfigService,
  ) {}

  @Get('/')
  @Render('layout')
  async home(@Req() req: Request) {
    const githubLogin = this.config.get<string>('GITHUB_LOGIN') ?? '';
    const gitlabUserId = this.config.get<string>('GITLAB_USER_ID') ?? '';
    const gitlabBaseUrl = this.config.get<string>('GITLAB_BASE_URL') ?? '';

    const [contributions, repos] = await Promise.all([
      this.gitCal.getCombinedCalendar({
        githubLogin,
        gitlabUserId,
        gitlabBaseUrl,
        daysBack: 189,
      }),
      this.gitCal.getTopRepos({
        githubLogin,
        gitlabUserId,
        gitlabBaseUrl,
        limit: 5,
      }),
    ]);

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
      github: {
        profileUrl: `https://github.com/${githubLogin}`,
        contributions,
        repos,
      },
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
