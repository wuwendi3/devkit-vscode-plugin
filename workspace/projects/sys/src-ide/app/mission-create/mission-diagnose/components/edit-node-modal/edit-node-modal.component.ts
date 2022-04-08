import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { I18nService } from '../../../../service/i18n.service';

@Component({
  selector: 'app-edit-node-modal',
  templateUrl: './edit-node-modal.component.html',
  styleUrls: ['./edit-node-modal.component.scss']
})
export class EditNodeModalComponent implements OnInit {
  @Input() labelWidth: string;
  @Input() nodeName: any;
  @Input() nodeIP: any;

  @ViewChild('missionModal') missionModal: any;

  public i18n: any;
  public explorer: string;

  constructor(public i18nService: I18nService) {
    this.i18n = this.i18nService.I18n();
    this.explorer = this.getExplorer();
  }

  ngOnInit(): void {
  }

  // 打开
  public open() {
    this.missionModal.Open();
  }

  // 父组件去关闭 drawer
  public close() {
    return new Promise((resolve, reject) => {
      this.missionModal.Close().then((res: any) => {
        resolve(res);
      }).catch((e: any) => {
        reject(e);
      });
    });
  }

  public getExplorer(): any {
    const explorer = window.navigator.userAgent;
    const ie11 = 'ActiveXObject' in window;

    if (explorer.indexOf('MSIE') >= 0 || ie11) {
      return 'ie';
    } else if (explorer.indexOf('Firefox') && !ie11) {
      return 'Firefox';
    } else if (explorer.indexOf('Chrome') && !ie11) {
      return 'Chrome';
    } else if (explorer.indexOf('Opera') && !ie11) {
      return 'Opera';
    } else if (explorer.indexOf('Safari') && !ie11) {
      return 'Safari';
    }
  }
}
