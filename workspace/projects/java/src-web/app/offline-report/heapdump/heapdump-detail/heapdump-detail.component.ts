import { AfterViewInit, Component, ElementRef, OnInit, Renderer2, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Util } from '@cloud/tiny3';
import { I18nService } from '../../../service/i18n.service';
import { ProfileDownloadService } from '../../../service/profile-download.service';

@Component({
  selector: 'app-heapdump-detail',
  templateUrl: './heapdump-detail.component.html',
  styleUrls: ['./heapdump-detail.component.scss']
})
export class HeapdumpDetailComponent implements OnInit, AfterViewInit {
  i18n: any;
  @ViewChild('container') private containerRef: ElementRef;
  constructor(
    private renderer2: Renderer2,
    private router: Router,
    private i18nService: I18nService,
    private downloadService: ProfileDownloadService,
  ) {
    this.i18n = this.i18nService.I18n();
   }
  public heapdumpName: string;
  public currentLang: string;
  public currentHover: any;
  public heapdumpTabs = [
    {
      tabName: 'memorydump',
      link: 'memorydump',
      active: true,
      show: true,
    },
    {
      tabName: 'reportInf',
      link: 'reportInf',
      active: false,
      show: true,
    }
  ];

  ngOnInit(): void {
    $('.header').css({ background: '#061829' });
    this.currentLang = sessionStorage.getItem('language');
    this.heapdumpName = sessionStorage.getItem('heapdumpReportTitle');
  }
  ngAfterViewInit(): void {
    this.renderer2.listen(this.containerRef.nativeElement, 'scroll', () => {
      // tiScroll 是tiny3的自定义事件，可以触发面板收起
      Util.trigger(document, 'tiScroll');
    });
  }
  public onHoverList(label?: any) {
    this.currentHover = label;
  }

  /**
   * 返回主页
   */
  public goHome() {
    this.downloadService.downloadItems.report.reportTab = 'memoryDump';
    this.router.navigate(['home']);
  }
  /**
   * 切换页签
   */
  public tabsToggle(index: any) {
    this.heapdumpTabs.forEach(tab => {
      tab.active = false;
    });
    this.heapdumpTabs[index].active = true;
  }

}
