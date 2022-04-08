import { Component, OnInit, Input, Output, EventEmitter, OnDestroy, ElementRef } from '@angular/core';
import axios from 'axios';
import { Subscription } from 'rxjs';
import {
  PortWorkerStatusService, AxiosService, I18nService,
  MessageService, CommonService
} from '../../../../service';

@Component({
  selector: 'app-check-weak-progress',
  templateUrl: './check-weak-progress.component.html',
  styleUrls: ['./check-weak-progress.component.scss']
})
export class CheckWeakProgressComponent implements OnInit, OnDestroy {
  @Input() reportId: any;
  @Output() createSucc = new EventEmitter();

  public i18n: any;
  public formatReport: string;

  public isSuccess = false; // 是否显示创建成功弹框
  public barWidth = 0;
  public totalBar = 440; // 进度条总宽
  public moveBar = 60; // 动画宽度
  public progess = 0; // 目前数据大小
  public totalProgress = 100;  // 总的数据大小
  public progessValue: string;  // 显示的进度值
  public moveTimer: any = null;
  public index = 1;

  private timer: any = null;
  private cancels: any = [];
  private closeTaskSub: Subscription;
  public progressStatus: string;  // 分析进度状态码

  constructor(
    private Axios: AxiosService,
    public i18nService: I18nService,
    private msgService: MessageService,
    private elementRef: ElementRef,
    private commonService: CommonService,
    public portWorkerStatusService: PortWorkerStatusService
  ) {
    this.i18n = this.i18nService.I18n();
  }

  ngOnInit() {
    this.getReport();
    this.closeTaskSub = this.msgService.getMessage().subscribe(message => {
      if (message.type === 'closeTaskMsg' && message.data.result.subType === 'weakCheck') {
        this.Axios.axios
          .delete(`/portadv/weakconsistency/tasks/${encodeURIComponent(this.reportId)}/stop/?task_type=10`)
            .then((resp: any) => {
              const msg = sessionStorage.getItem('language') === 'zh-cn' ? resp.infochinese : resp.info;
              if (this.timer) {
                clearTimeout(this.timer);
                this.timer = null;
              }
              while (this.cancels.length > 0) {
                this.cancels.pop()();
              }
              if (this.commonService.handleStatus(resp) === 0) {
                this.createSucc.emit({id: this.reportId, type: 'weakCheck', state: 'stop_success', msg});
                return;
              }
              this.createSucc.emit({ id: this.reportId, type: 'weakCheck', state: 'stop_failed', msg});
        });
      }
    });
  }

  getReport() {
    this.Axios.axios.defaults.headers.notit = true;
    const CancelToken = axios.CancelToken;
    this.Axios.axios.get(`/task/progress/?task_type=10&task_id=${encodeURIComponent(this.reportId)}`, {
      cancelToken: new CancelToken( c1 => (this.cancels.push(c1)))
    })
      .then((resp: any) => {
        this.progressStatus = resp.status;
        if (this.commonService.handleStatus(resp) === 0) {
          this.progess = resp.data.progress;
          // 当进度小于 1 的时候 显示进度条动画
          if (this.progess < 1) {
            if (!this.moveTimer) {
              const el = this.elementRef.nativeElement.querySelector('.progress-bar-zero');
              this.moveAnimation(el);
            }
          } else {
            this.progessValue = this.progess + '%';
            this.barWidth = Math.floor(this.progess / this.totalProgress * this.totalBar);
            this.moveTimer = null;
            clearInterval(this.moveTimer);
          }
          this.formatReport = this.formatCreatedId(this.reportId);

          // 2: 运行中，5：等待中
          if (resp.data.runningstatus === 2 || resp.data.runningstatus === 255) {
            if (this.timer) {
              clearTimeout(this.timer);
              this.timer = null;
              if (this.index === 5) {
                this.msgService.sendMessage({
                  type: 'queryDisk'
                });
                this.index = 1;
              } else {
                this.index++;
              }
            }
            this.msgService.sendMessage({
              type: 'creatingWeakCheckProgress',
              data: true
            });
            this.timer = setTimeout(() => { this.getReport(); }, 1000);
          } else if (resp.data.runningstatus === 0) { // 成功
            this.msgService.sendMessage({ type: 'bcCheckResult', data: resp});
            clearTimeout(this.timer);
            this.timer = null;
            this.isSuccess = true;
            const msg =  sessionStorage.getItem('language') === 'zh-cn' ? resp.data.infochinese : resp.data.info;
            const noDataMsg =  sessionStorage.getItem('language') === 'zh-cn' ? resp.infochinese : resp.info;
            setTimeout(() => {
              this.createSucc.emit({ id: this.reportId, type: 'weakCheck', state: 'success',
               msg, flag: true, status: resp.status, noDataMsg});
              this.msgService.sendMessage({ type: 'creatingWeakCheckProgress', data: false });
            }, 3000);
          } else { // 失败
            clearTimeout(this.timer);
            this.timer = null;
            const msg =  sessionStorage.getItem('language') === 'zh-cn' ? resp.data.infochinese : resp.data.info;
            this.createSucc.emit({ id: this.reportId, type: 'weakCheck', state: 'failed', msg });
            this.msgService.sendMessage({ type: 'creatingWeakCheckProgress', data: false });
          }
        } else {
          const msg = sessionStorage.getItem('language') === 'zh-cn' ? resp.infochinese : resp.info;
          this.createSucc.emit({ id: this.reportId, type: 'weakCheck', state: 'failed', msg });
          this.msgService.sendMessage({ type: 'creatingWeakCheckProgress', data: false });
        }
      })
      .catch((err: any) => {
        this.createSucc.emit({ id: this.reportId, type: 'weakCheck', state: 'failed', msg: ''});
        this.msgService.sendMessage({ type: 'creatingWeakCheckProgress', data: false });
      });
    this.Axios.axios.defaults.headers.notit = false;
  }

  // 关闭任务
  public closeTask() {
    const resultMsg = {
      id: this.reportId,
      type: 'stopConfirm',
      subType: 'weakCheck',
      state: 'prompt',
    };
    this.msgService.sendMessage({
      type: 'creatingResultMsg',
      data: resultMsg
    });
  }

  ngOnDestroy(): void {
    if (this.closeTaskSub) { this.closeTaskSub.unsubscribe(); }
  }

  // 移动动画
  moveAnimation(el: any) {
    let left = 0;
    let bool = true;
    this.moveTimer = setInterval(() => {
      left = bool ? left + 5 : left - 5;
      if (left <= 0) {
        left = 0;
        bool = true;
      } else if (left >= Number((100 * (1 - this.moveBar / this.totalBar)).toFixed(0))) {
        left = Number((100 * (1 - this.moveBar / this.totalBar)).toFixed(0));
        bool = false;
      }
      el.style.left = left + '%';
    }, 100);
  }

  /**
   * 对时间戳进行格式化处理
   * @param time  时间戳
   */
  formatCreatedId(time: string): string {
    const years = time.slice(0, 4);
    const months = time.slice(4, 6);
    const days = time.slice(6, 8);
    const hours = time.slice(8, 10);
    const minutes = time.slice(10, 12);
    const seconds = time.slice(12, 14);
    return `${years}/${months}/${days} ${hours}:${minutes}:${seconds}`;
  }

}
