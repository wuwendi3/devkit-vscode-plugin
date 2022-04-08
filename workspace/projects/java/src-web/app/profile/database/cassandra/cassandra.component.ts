import { Component, OnInit, ElementRef, OnDestroy, AfterContentInit, Input, ViewChild } from '@angular/core';
import { StompService } from '../../../service/stomp.service';
import { MessageService } from '../../../service/message.service';
import { MytipService } from '../../../service/mytip.service';
import { TiTableColumns, TiTableRowData, TiTableSrcData, TiTreeNode, TiValidators } from '@cloud/tiny3';
import { fromEvent, Subscription } from 'rxjs';
import { I18nService } from '../../../service/i18n.service';
import { ProfileDownloadService } from '../../../service/profile-download.service';
import { LibService } from '../../../service/lib.service';

import { RegularVerify } from 'projects/java/src-com/app/utils/regular-verify';
import { SpinnerBlurInfo } from 'projects/java/src-com/app/utils/spinner-info.type';
import {
  FormBuilder,
  FormControl,
  FormGroup
} from '@angular/forms';

@Component({
  selector: 'app-cassandra',
  templateUrl: './cassandra.component.html',
  styleUrls: ['./cassandra.component.scss']
})
export class CassandraComponent implements OnInit, OnDestroy, AfterContentInit {
  @Input() snapShot: boolean;
  @Input() snapShotData: any;
  @ViewChild('cassEcharts') cassEcharts: any;
  @ViewChild('app-hotword-table', { static: false }) hotWordTable: any;
  constructor(
    private stompService: StompService,
    private el: ElementRef,
    private msgService: MessageService,
    public i18nService: I18nService,
    public fb: FormBuilder,
    public regularVerify: RegularVerify,
    private downloadService: ProfileDownloadService,
    public myTip: MytipService,
    public libService: LibService
  ) {
    this.i18n = this.i18nService.I18n();

    this.cassandraGroup = fb.group({
      cassandra_threshold: new FormControl(50, {
        validators: [
          TiValidators.required,
          TiValidators.minValue(0),
          TiValidators.maxValue(10000),
        ],
        updateOn: 'change',
      }),
    });
  }

  // sampling配置
  public cassandraGroup: FormGroup;
  public cassandraBlur: SpinnerBlurInfo;

  i18n: any;
  public first = true;
  public stompClient: any;
  public subscribeStomp: any;
  public topicUrl: string;
  public jvmId: string;
  public guardianId: string;

  public cassBtnTip: string;
  public cassThresholdTip: string;

  public durationTotal = 0;
  public insCountWidth = 0;
  public insCountTotal = 0;
  private columnsWidth2 = 0;

  public tip1Context: any;
  public count = 20;
  private updateTimer: any = null;
  public updateOptions: any;

  public displayed: Array<TiTableRowData> = [];
  public srcData: TiTableSrcData;
  private data: any = [];
  public columns: Array<TiTableColumns> = [
    {
      title: 'hot_statement',
      width: '30%',
      sortKey: 'label'
    },
    {
      title: 'total_time',
      width: '30%',
      isSort: true,
      sortKey: 'duration',
      sortStatus: 'sort'
    },
    {
      title: 'aver_time',
      width: '20%',
      isSort: true,
      sortKey: 'aver',
      sortStatus: 'sort'
    },
    {
      title: 'exec_time',
      width: '20%',
      sortKey: 'count'
    }
  ];

  public echartItems = ['executed', 'aveTime'];
  public echartDatas: any = {
    executed: [],
    aveTime: [],
    keys: [],
    label: ['executed', 'aveTime'],
    time1: [],
    gridHeight: 100
  };
  public threshold = {
    label: '',
    max: 10000,
    min: 0,
    value: 50,
    rangeValue: [0, 10000],
    format: 'N0',
  };

  private isStopMsgSub: Subscription;
  public deleteOneTab: Subscription;
  private cassSub: Subscription;
  private updataCassSub: Subscription;
  public startBtnDisabled = false;
  // stack trace部分
  public stackTranceData: Array<TiTreeNode> = [];
  private isStopRefresh: any = null;
  public currentSql: string;
  public noDadaInfo: string;
  private cassDatas = {};

  public startDate = '';

  public isStart = true;
  private isStopFlag = true;

  public isDownload = false;

  private expandNodes: any = {};
  public snapCount = 0;
  public noDataMsg = '';
  public limitTime: any;
  public isDoSnapClick = true; // 防止重复点击
  public timeData: any = [];
  public cassTimeout: any = null;
  public analyzID: string;
  private originData: any;  // 保存未排序的表格数据
  private sortIndex: number = null;
  // 上一次刷新图表时间
  private lastRefreshEchartTime = 0;

  ngOnInit() {
    this.limitTime = this.downloadService.dataLimit.cassandra.timeValue;
    this.noDataMsg = this.i18n.profileNoData.cassandraNoDataMsg;
    this.srcData = {
      data: [], // 源数据
      state: {
        searched: false,
        sorted: false,
        paginated: false
      }
    };

    this.setSpinnerBlur();

    this.echartDatas.keys = [
      {
        label: this.i18n.protalserver_profiling_jdbc.exec_statement,
        unit: this.i18n.common_term_jdbc_times
      },
      {
        label: this.i18n.protalserver_profiling_jdbc.aver_exec_time,
        unit: ' ms'
      }
    ];
    this.noDadaInfo = this.i18n.common_term_task_nodata;
    this.startBtnDisabled = JSON.parse(sessionStorage.getItem('isProStop'));
    this.threshold.label = this.i18n.protalserver_profiling_http_threshold;
    this.cassandraGroup.controls.cassandra_threshold.setValue(this.downloadService.dataSave.cassThreshold);
    this.isStart = this.downloadService.dataSave.isCassStart;
    if (this.isStart) {
      this.refreshTableData();
    }
    this.cassBtnTip = this.i18n.protalserver_profiling_cass.btn_tip;
    this.cassThresholdTip = this.i18n.protalserver_profiling_http_threshold_tip;
    this.jvmId = sessionStorage.getItem('jvmId');
    this.guardianId = sessionStorage.getItem('guardianId');
    if (this.snapShot) { return; }
    this.handleSnapShotCount('cassandra');
    this.isStopMsgSub = this.msgService.getMessage().subscribe(msg => {
      if (msg.type === 'isStopPro') {
        this.isStart = false;
        this.startBtnDisabled = true;
        this.clearCassTimer();
        clearInterval(this.isStopRefresh);
        this.isStopRefresh = null;
      }
    });
    this.data = this.mapDownloadTree(this.downloadService.downloadItems.cassandra.hotspot);
    for (const item of this.data) {
      item.isShow = true;
      this.durationTotal += item.duration;
    }
    let tempTimer1 = setTimeout(() => {
      this.getCountProportion();
      clearTimeout(tempTimer1);
      tempTimer1 = null;
    }, 0);
    this.mapDownlaodEcharts(this.downloadService.downloadItems.cassandra.monitor.data);
    this.isDownload = JSON.parse(sessionStorage.getItem('download_profile'));
    if (this.isDownload) {
      this.cassandraGroup.controls.cassandra_threshold.setValue(
        this.downloadService.downloadItems.cassandra.threshold);
      this.startDate = this.downloadService.downloadItems.cassandra.monitor.startDate;
      return;
    }

    let startTime = 0;
    this.cassSub = this.msgService.getMessage().subscribe(msg => {
      if (msg.type === 'cassandra') {
        if (msg.data) {
          this.clearCassTimer();
        }
        this.processData(msg.data);
        if (startTime === 0) {
          startTime = msg.data[0].start;
        }
      }
    });
    this.updataCassSub = this.msgService
      .getMessage()
      .subscribe(msg => {
        if (msg.type === 'updata_cassandra') {
          this.updateData(msg.data);
        }
        if (msg.type === 'dataLimit') {
          if (msg.data.type === 'cassandra') {
            this.echartDatas.time1 = [];
            this.echartItems.forEach(item => {
              this.echartDatas[item] = [];
            });
            this.limitTime = this.downloadService.dataLimit.cassandra.timeValue;
          }
        }
        if (msg.type === 'isRestart') {
          this.startBtnDisabled = false;
          this.cassandraGroup.controls.cassandra_threshold.setValue(50);
          this.snapCount = 0;
          this.clearCassTimer();
          this.initData();
        }
        if (msg.type === 'isClear' || msg.type === 'isClearOne') {
          this.initData();
        }
        if (msg.type === 'exportData') {
          this.downloadData();
        }
      });
    this.deleteOneTab = this.msgService.getMessage().subscribe(msg => {
      if (msg.type === 'setDeleteOne') {
        if (this.srcData.data.length === 0 && this.echartDatas.executed.length === 0) {
          this.msgService.sendMessage({
            type: 'getDeleteOne',
            isNoData: 'true',
          });
        } else {
          this.msgService.sendMessage({
            type: 'getDeleteOne',
            isNoData: 'false',
          });
        }
      }
    });
  }

  /**
   * 微调器回填初始化
   */
  public setSpinnerBlur() {
    this.cassandraBlur = {
      control: this.cassandraGroup.controls.cassandra_threshold,
      min: 0,
      max: 10000,
    };
  }

  /**
   * 微调器回填
   */
  public verifySpinnerValue(value: any) {
    this.regularVerify.setSpinnerInfo(value);
  }

  private initData() {
    this.echartDatas.time1 = [];
    this.echartItems.forEach(item => {
      this.echartDatas[item] = [];
    });
    this.data = [];
    this.cassDatas = {};
    this.srcData.data = [];
  }
  private mapDownlaodEcharts(data: any) {
    const keys = Object.keys(data);
    const series: any = [];
    const xAxis: any = [];
    this.echartDatas.time1 = keys;
    this.echartDatas.executed = [];
    this.echartDatas.aveTime = [];
    keys.forEach(key => {
      this.echartDatas.executed.push(data[key].averCount);
      this.echartDatas.aveTime.push(data[key].averTime);
    });
    this.echartItems.forEach(item => {
      series.push({
        data: this.echartDatas[item]
      });
      xAxis.push({
        data: this.echartDatas.time1
      });
    });
    xAxis.push({
      data: this.echartDatas.time1
    });
    this.updateOptions = {
      series,
      xAxis
    };
    this.timeData = this.echartDatas.time1;
  }

  private mapDownloadTree(data: any, pId?: any) {
    data.map((item: any) => {
      pId = pId || '';
      item.id = pId + item.label;
      item.isShow = false;
      if (item.children && item.children.length) {
        this.mapDownloadTree(item.children, item.id);
      }
    });
    return data;
  }

  private refreshTableData() {
    this.isStopRefresh = setInterval(() => {
      this.getCountProportion();
    }, 10000);
    this.stompService.cassTimer = setInterval(() => {
      this.stompService.cassUpdata();
    }, this.stompService.jdbcStep);
  }

  private processData(data: any) {
    let srcDatas = [];
    const newCass = JSON.parse(JSON.stringify(this.cassDatas));
    data.forEach((item: any) => {
      this.durationTotal += item.duration;
      this.handle(newCass, item);
    });
    this.cassDatas = newCass;
    srcDatas = this.defaultSort(Object.values(newCass));
    this.data = [...srcDatas];
    if (this.first) {
      this.getCountProportion();
      this.first = false;
    }

  }

  private handle(cass: any, itemData: any) {
    const cql = itemData.cql;
    const duration = itemData.duration;
    if (!cass[cql]) {
      cass[cql] = {
        label: cql,
        name: cql,
        duration: 0,
        count: 0,
        aver: 0,
        id: cql,
        isShow: true,
        stackTraces: { label_name: 'root', label: 'root', count: 0 }
      };
    }
    cass[cql].duration += duration;
    cass[cql].count++;
    cass[cql].aver = (cass[cql].duration / cass[cql].count / 1000).toFixed(2);
    if (itemData.stackTraces.length) { this.merge(cass[cql].stackTraces, itemData.stackTraces, itemData); }
  }

  private merge(theTree: any, frames: any, itemData: any) {
    let node = theTree;
    frames.forEach((frame: any) => {
      const desc = `${frame.className_}.${frame.methodName_}() ${frame.lineNum_}`;
      node.children = node.children || [];
      let sameChild;
      for (const child of node.children) {
        if (child.label_name === desc) {
          sameChild = child;
          break;
        }
      }
      if (!sameChild) {
        const pId = node.id || itemData.cql;
        sameChild = {
          label_name: desc,
          label: '',
          count: 0,
          duration: 0,
          aver: 0,
          id: `${pId}_${desc}`,
          isShow: false,
          insCountWidth: 0,
          totalDurPer: '',
          isShowTip: ''
        };
        node.children.push(sameChild);
      }

      sameChild.count += 1;
      sameChild.duration += itemData.duration;
      sameChild.aver = (sameChild.duration / sameChild.count / 1000).toFixed(2);
      sameChild.label = `${sameChild.count} Count - ${sameChild.label_name}`;
      sameChild.name = sameChild.label_name;
      node = sameChild;
    });
  }

  /**
   * 刷新echart图表
   */
  private updateData(data: any) {
    const series: any = [];
    const xAxis: any = [];
    this.startDate = this.libService.dateFormat(data.endTime, 'yyyy/MM/dd');

    if (this.echartDatas.executed.length > 20 * Number(this.limitTime)) { this.echartDatas.time1.shift(); }
    this.echartDatas.time1.push(this.libService.dateFormat(data.endTime, 'hh:mm:ss'));
    this.timeData = this.echartDatas.time1;
    this.echartItems.forEach(item => {
      if (this.echartDatas[item].length > 20 * Number(this.limitTime)) { this.echartDatas[item].shift(); }
      this.echartDatas[item].push(data[item]);
      series.push({
        data: this.echartDatas[item]
      });
      xAxis.push({
        data: this.echartDatas.time1
      });
    });
    xAxis.push({
      data: this.echartDatas.time1
    });

    const nowDate = Date.now();
    if (nowDate - this.lastRefreshEchartTime >= 2000) {
      this.lastRefreshEchartTime = nowDate;
      this.updateOptions = {
        series,
        xAxis
      };
      if (this.cassEcharts) {
        this.cassEcharts.updateEchartsData(this.updateOptions);
      }
    }
  }
  ngAfterContentInit(): void {
    let tempTimer = setTimeout(() => {
      if (this.el.nativeElement.querySelector('.insCount')) {
        this.insCountTotal = this.el.nativeElement.querySelector(
          '.insCount'
        ).offsetWidth * 0.6;
        this.columnsWidth2 = $('.totalDurtionTh').width();
        this.getCountProportion();
      } else {
        this.insCountTotal = 300;
      }
      clearTimeout(tempTimer);
      tempTimer = null;
    }, 0);
    fromEvent(window, 'resize').subscribe(event => {
      this.insCountTotal = this.el.nativeElement.querySelector(
        '.insCount'
      ).offsetWidth * 0.6;
      this.columnsWidth2 = $('.totalDurtionTh').width();
      this.getCountProportion();
    });
  }

  private getCountProportion() {
    if (this.data.length === 0) { return; }
    this.data.forEach((item: any) => {
      item.insCountWidth = (item.duration / this.durationTotal) * this.insCountTotal;
      item.totalDurPer = item.duration / 1000 + '(' + ((item.duration / this.durationTotal) * 100).toFixed(2) + '%)';
      item.isShowTip = (item.insCountWidth + item.totalDurPer.length * 8) >= this.columnsWidth2;
      item.children = item.stackTraces ? item.stackTraces.children : item.children;
    });
    this.originData = this.deepClone(this.data);
    if (this.sortIndex !== null) {
      const column = this.columns[this.sortIndex];
      switch (column.sortStatus) {
        case 'sort-ascent':
          this.data.sort((a: any, b: any) => {
            return a[column.sortKey] - b[column.sortKey];
          });
          break;
        case 'sort-descent':
          this.data.sort((a: any, b: any) => {
            return b[column.sortKey] - a[column.sortKey];
          });
          break;
        default:
          break;
      }
    }
    const srcData = [...this.data];
    this.durationTotal = 0;
    for (const item of srcData) {
      this.durationTotal += item.duration;
    }
    this.srcData.data = this.getTreeTableArr(srcData);
  }
  startCass() {
    if (this.startBtnDisabled || this.snapShot) { return; }
    this.stompService.cassTimeInit = {
      startTime: 0,
      endTime: 0,
      count_pre_s: 0,
      duration_pre_s: 0
    };
    if (this.cassandraGroup.controls.cassandra_threshold.value === '') {
      const invalidEl = this.el.nativeElement.querySelector(`.cass-threshold.ng-invalid.ng-touched:not([tiFocused])`);
      if (invalidEl) {
        const inputEl = $(invalidEl).find('.ti3-spinner-input-box>.ti3-spinner-input')[0];
        inputEl.focus();
      }
      return;
    }
    this.isStopFlag = true;
    this.stompService.startStompRequest('/cmd/start-instrument-cassandra', {
      jvmId: this.jvmId,
      guardianId: this.guardianId,
      threshold: this.cassandraGroup.controls.cassandra_threshold.value * 1000
    });
    if (this.srcData.data.length === 0) {
      this.cassTimeout = setTimeout(() => {
        this.myTip.alertInfo({
          type: 'warn',
          content: this.i18n.profileNodataTip.cassandra,
          time: 10000
        });
      }, 30000);
    }
    this.isStart = !this.isStart;
    this.downloadService.dataSave.cassThreshold = this.cassandraGroup.controls.cassandra_threshold.value;
    this.downloadService.dataSave.isCassStart = true;
    // 启动mongodb分析时会停止file-io和socket-io分析
    this.downloadService.dataSave.isSocketIOStart = false;
    this.downloadService.dataSave.isFileIOStart = false;

    // 启动mongodb分析时会停止http分析
    this.downloadService.dataSave.isHttpStart = false;
    let tempTimer1 = setTimeout(() => {
      clearInterval(this.stompService.httpTimer);
      this.stompService.httpTimer = null;
      clearTimeout(tempTimer1);
      tempTimer1 = null;
    }, this.stompService.httpStep);

    if (this.stompService.cassTimer) {
      this.isStopFlag = false;
      clearInterval(this.stompService.cassTimer);
      this.stompService.cassTimer = null;
    }
    this.refreshTableData();
  }
  public stopCass() {
    this.stompService.startStompRequest('/cmd/stop-instrument-cassandra', {
      jvmId: this.jvmId,
      guardianId: this.guardianId
    });
    this.isStart = !this.isStart;
    this.downloadService.dataSave.isCassStart = false;
    this.clearCassTimer();
    let tempTimer = setTimeout(() => {
      if (!this.isStopFlag) {
        this.isStopFlag = true;
        return;
      }
      clearInterval(this.stompService.cassTimer);
      this.stompService.cassTimer = null;
      clearInterval(this.stompService.jdbcTimer);
      this.stompService.jdbcTimer = null;
      clearInterval(this.stompService.hbaseTimer);
      this.stompService.hbaseTimer = null;
      clearInterval(this.stompService.mdbTimer);
      this.stompService.mdbTimer = null;
      clearInterval(this.isStopRefresh);
      this.isStopRefresh = null;
      clearTimeout(tempTimer);
      tempTimer = null;
    }, this.stompService.jdbcStep * 2);
  }

  ngOnDestroy(): void {
    if (this.isDownload || this.snapShot) { return; }
    this.downloadData();
    clearInterval(this.updateTimer);
    this.updateTimer = null;
    if (this.isStopMsgSub) { this.isStopMsgSub.unsubscribe(); }
    if (this.updataCassSub) { this.updataCassSub.unsubscribe(); }
    if (this.cassSub) { this.updataCassSub.unsubscribe(); }
    this.msgService.sendMessage({ type: 'getDeleteOne' });  // 清除本页面的发送事件
    if (this.deleteOneTab) { this.deleteOneTab.unsubscribe(); }
    if (this.stompService.cassTimer) {
      clearInterval(this.stompService.cassTimer);
      this.stompService.cassTimer = null;
    }
    if (this.isStopRefresh) {
      clearInterval(this.isStopRefresh);
      this.isStopRefresh = null;
    }
  }
  public downloadData() {
    this.downloadService.dataSave.isCassStart = this.isStart;
    this.downloadService.downloadItems.cassandra.hotspot = this.downloadClone(this.data);
    this.downloadService.downloadItems.cassandra.monitor.data = this.handleDownloadData();
    this.downloadService.downloadItems.cassandra.threshold =
      this.cassandraGroup.controls.cassandra_threshold.value;
    this.downloadService.downloadItems.cassandra.monitor.startDate = this.startDate;
  }

  /**
   * 传送expandNodes数据
   */
  public send_ExpandData(e: any) {
    this.expandNodes = e;
  }

  // pArray: 父级数据， pLevel: 父级层数
  // 将有层级结构的数据扁平化
  private getTreeTableArr(pArray: Array<any>, pLevel?: number, pId?: any): Array<any> {
    let tableArr: Array<any> = [];
    if (pArray === undefined) {
      return tableArr;
    }

    pLevel = pLevel === undefined ? 0 : pLevel + 1;
    pId = pId === undefined ? 'tiTableRoot' : pId;

    let temp: any;
    for (const item of pArray) {
      let isShow = item.isShow;
      let expand = false;
      if (this.expandNodes[item.id]) {
        isShow = this.expandNodes[item.id].isShow;
        expand = this.expandNodes[item.id].expand;
      }
      temp = this.deepClone(item);
      delete temp.children;
      temp.level = pLevel;
      temp.pId = pId;
      temp.isShow = isShow;
      temp.hasChildren = false;
      temp.insCountWidth = (temp.duration / this.durationTotal) * this.insCountTotal;
      temp.totalDurPer = temp.duration / 1000 + '(' + ((temp.duration / this.durationTotal) * 100).toFixed(2) + '%)';
      temp.isShowTip = (temp.insCountWidth + temp.totalDurPer.length * 8) >= this.columnsWidth2;
      tableArr.push(temp); // 也可以在此循环中做其他格式化处理
      if (item.children && item.children.length) {
        temp.hasChildren = true;
        temp.expand = expand;
        tableArr = tableArr.concat(this.getTreeTableArr(item.children, pLevel, temp.id));
      }
    }

    return tableArr;
  }
  public toggle(node: any): void {
    node.expand = !node.expand;
    if (!this.expandNodes[node.id]) { this.expandNodes[node.id] = {}; }
    this.toggleChildren(this.srcData.data, node.id, node.expand);
    this.expandNodes[node.id].expand = node.expand;
    this.expandNodes[node.id].isShow = node.isShow;
    if (!this.expandNodes[node.id].isShow) { delete this.expandNodes[node.id]; }
  }

  private toggleChildren(data: Array<any>, pId: any, pExpand: boolean): void {
    for (const node of data) {
      if (node.pId === pId) {
        node.isShow = pExpand; // 处理当前子节点
        if (pExpand === false) {// 折叠时递归处理当前节点的子节点
          delete this.expandNodes[node.id];
          this.toggleChildren(data, node.id, false);
        } else {  // 展开时递归处理当前节点的子节点
          this.expandNodes[node.id] = this.expandNodes[node.id] || {};
          this.expandNodes[node.id].isShow = true;
          this.expandNodes[node.id].expand = false;
          node.expand = false;
          if (node.expand === true) {
            this.toggleChildren(data, node.id, true);
          }
        }
      }
    }
  }

  public getLevelStyle(node: any): { 'padding-left': string } {
    return {
      'padding-left': `${node.level * 18 + 10}px`
    };
  }

  private deepClone(obj: any): any { // 深拷贝，类似于1.x中的angular.copy() TODO: 是否需要将该方法写进组件
    if (typeof (obj) !== 'object' || obj === null) {
      return obj;
    }

    let clone: any;

    clone = Array.isArray(obj) ? obj.slice() : { ...obj };

    const keys: Array<string> = Object.keys(clone);

    for (const key of keys) {
      clone[key] = this.deepClone(clone[key]);
    }

    return clone;
  }

  private downloadClone(obj: any): any {
    if (typeof (obj) !== 'object' || obj === null) {
      return obj;
    }
    let clone: any;
    clone = Array.isArray(obj) ? obj.slice() : { ...obj };
    const keys: Array<string> = Object.keys(clone);
    for (const key of keys) {
      clone[key] = this.downloadClone(clone[key]);
      if (key === 'id' || key === 'isShow' || key === 'insCountWidth' ||
        key === 'totalDurPer' || key === 'isShowTip' || key === 'stackTraces' || key === 'label_name') {
        delete clone[key];
      }
    }

    return clone;
  }

  private handleDownloadData() {
    const downloadData: any = {};
    this.echartDatas.time1.forEach((item: any, idx: any) => {
      downloadData[item] = {
        averTime: this.echartDatas.aveTime[idx],
        averCount: this.echartDatas.executed[idx]
      };
    });
    return downloadData;
  }

  private defaultSort(datas: any) {
    const sortedArr = datas.sort((a: any, b: any) => {
      return b.count - a.count;
    });
    return sortedArr;
  }

  // 快照点击事件
  public compare(property: any) {
    return (a: any, b: any) => {
      const value1 = a[property];
      const value2 = b[property];
      return value2 - value1;
    };
  }
  public doSnap(type: any) {
    if (this.isDoSnapClick) {
      this.isDoSnapClick = false;
      // 事件
      this.doSnapFn(type);
      // 定时器
      let tempTimer = setTimeout(() => {
        this.isDoSnapClick = true;
        clearTimeout(tempTimer);
        tempTimer = null;
      }, 1000); // 一秒内不能重复点击
    }
  }
  public doSnapFn(type: any) {
    if (this.isDownload) { return; }
    if (this.data.length < 1) {
      return this.myTip.alertInfo({
        type: 'warn',
        content: this.i18n.snapshot_analysis_noData,
        time: 3500
      });
    }
    const snapCounts = 5;
    if (this.snapCount < snapCounts) {
      const tableTop = this.downloadClone(this.data);
      const nowTime = this.libService.getSnapTime();
      const snapShot = this.downloadService.downloadItems.snapShot.snapShotData &&
        JSON.parse(this.downloadService.downloadItems.snapShot.snapShotData) || {};
      if (!snapShot[type]) {
        snapShot[type] = {
          label: this.i18n.protalserver_profiling_tab.cassandra,
          type,
          children: [],
        };
      }
      snapShot[type].children.push(
        {
          label: nowTime,
          type,
          value: {
            file: tableTop,
            insCountTotal: this.insCountTotal,
            durationTotal: this.durationTotal,
            threshold: this.cassandraGroup.controls.cassandra_threshold.value,
            snapCount: this.snapCount + 1,
            echarts: {
              startDate: this.startDate,
              data: this.handleDownloadData()
            },
            sortIndex: this.sortIndex,
            sortStatus: this.sortIndex === null ? '' : this.columns[this.sortIndex].sortStatus
          }
        }
      );
      this.downloadService.downloadItems.snapShot.snapShotData = JSON.stringify(snapShot);
      this.downloadService.downloadItems.snapShot.data = snapShot;
      this.downloadService.downloadItems.cassandra.snapCount = this.snapCount + 1;
      this.myTip.alertInfo({
        type: 'success',
        content: this.i18n.do_snapshot_success,
        time: 3500
      });
    } else {
      this.myTip.alertInfo({
        type: 'warn',
        content: this.i18n.snapshot_analysis_alert,
        time: 3500
      });
    }
    this.handleSnapShotCount(type);
  }
  public importSnapData(snapShotData: any) {
    this.data = this.mapDownloadTree(snapShotData.file);
    let total = 0;
    for (const item of this.data) {
      item.isShow = true;
      total += item.duration;
    }
    this.durationTotal = total;
    this.sortIndex = snapShotData.sortIndex;
    if (this.sortIndex !== null) {
      this.columns.forEach((item, index) => {
        if (item.isSort && index === this.sortIndex) {
          item.sortStatus = snapShotData.sortStatus;
        } else if (item.isSort && index !== this.sortIndex) {
          item.sortStatus = 'sort';
        }
      });
    }
    this.insCountTotal = snapShotData.insCountTotal;
    this.isStart = false;
    this.startDate = snapShotData.echarts.startDate;
    this.snapCount = snapShotData.snapCount;
    let tempTimer = setTimeout(() => {
      this.getCountProportion();
      this.cassandraGroup.controls.cassandra_threshold.setValue(snapShotData.threshold);
      clearTimeout(tempTimer);
      tempTimer = null;
    }, 200);
    this.mapDownlaodEcharts(snapShotData.echarts.data);
  }
  public handleSnapShotCount(type: any) {
    this.snapCount = this.downloadService.downloadItems.cassandra.snapCount;
  }
  public clearCassTimer() {
    clearTimeout(this.cassTimeout);
    this.cassTimeout = null;
  }
  /**
   * 表格排序
   */
  public onTableSort(index: number) {
    const column = this.columns[index];
    this.sortIndex = index;
    // 清除其他字段的排序
    this.columns.forEach((item, idx) => {
      if (item.isSort && idx !== index) {
        item.sortStatus = 'sort';
      }
    });
    switch (column.sortStatus) {
      case 'sort-ascent':
        column.sortStatus = 'sort-descent';
        this.data.sort((a: any, b: any) => {
          return b[column.sortKey] - a[column.sortKey];
        });
        break;
      case 'sort-descent':
        column.sortStatus = 'sort';
        this.data = this.deepClone(this.originData);
        break;
      default:
        column.sortStatus = 'sort-ascent';
        this.data.sort((a: any, b: any) => {
          return a[column.sortKey] - b[column.sortKey];
        });
        break;
    }
    const srcData = [...this.data];
    this.durationTotal = 0;
    for (const item of srcData) {
      this.durationTotal += item.duration;
    }
    this.srcData.data = this.getTreeTableArr(srcData);
  }
}
