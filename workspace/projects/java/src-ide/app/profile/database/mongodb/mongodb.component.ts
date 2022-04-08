import { Component, OnInit, OnDestroy, AfterContentInit, Input, ViewChild } from '@angular/core';
import { StompService } from '../../../service/stomp.service';
import { MessageService } from '../../../service/message.service';
import { MytipService } from '../../../service/mytip.service';
import { TiTableColumns, TiTableRowData, TiTableSrcData, TiTreeNode, TiValidators } from '@cloud/tiny3';
import { fromEvent, Subscription } from 'rxjs';
import { I18nService } from '../../../service/i18n.service';
import { ProfileDownloadService } from '../../../service/profile-download.service';
import { Router } from '@angular/router';
import { Utils } from '../../../service/utils.service';
import { VscodeService } from '../../../service/vscode.service';
import { RegularVerify } from 'projects/java/src-com/app/utils/regular-verify';
import { SpinnerBlurInfo } from 'projects/java/src-com/app/utils/spinner-info.type';
import {
    FormBuilder,
    FormControl,
    FormGroup,
} from '@angular/forms';

@Component({
    selector: 'app-mongodb',
    templateUrl: './mongodb.component.html',
    styleUrls: ['./mongodb.component.scss']
})
export class MongodbComponent implements OnInit, OnDestroy, AfterContentInit {
    @Input() snapShot: boolean;
    @Input() snapShotData: any;
    @ViewChild('excutedEchart', { static: false }) excutedEchart: any;
    @ViewChild('averageEchart', { static: false }) averageEchart: any;
    @ViewChild('timeLineDetail', { static: false }) timeLineDetail: any;
    @ViewChild('app-hotword-table', { static: false }) hotWordTable: any;
    constructor(
        private stompService: StompService,
        private msgService: MessageService,
        public i18nService: I18nService,
        public fb: FormBuilder,
        public regularVerify: RegularVerify,
        private downloadService: ProfileDownloadService,
        private router: Router,
        public mytip: MytipService,
        private vscodeService: VscodeService,
    ) {
        this.i18n = this.i18nService.I18n();

        this.mongodbGroup = fb.group({
            mongodb_threshold: new FormControl(50, {
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
    public mongodbGroup: FormGroup;
    public mongodbBlur: SpinnerBlurInfo;

    public timeData: any[] = []; // 时间轴数据
    public timeLine = {
        start: 0,
        end: 100
    };
    public excutedUpdateOptions: any = {};
    public avarageUpdateOptions: any = {};
    private groupId: any;
    i18n: any;
    public first = true;
    public stompClient: any;
    public subscribeStomp: any;
    public topicUrl: string;
    public jvmId: string;
    public guardianId: string;

    public mdbBtnTip: string;
    public mdbThresholdTip: string;

    public durationTotal = 0;
    public insCountWidth = 0;
    public insCountTotal = 0;
    private columnsWidth2 = 0;
    public rowId: string;

    public count = 20;
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

    // echart表grid配置项
    public echartGridRight = 24;
    public baseTop = 20;
    public gridHeight = 130;

    public echartItems = ['executed', 'aveTime'];
    public echartDatas: any = {
        executed: [],
        aveTime: [],
        keys: [],
        label: ['executed', 'aveTime'],
        time: [],
        gridHeight: 100
    };
    public excutedEchartDatas: any = {
        executed: [],
        keys: [],
        label: ['executed'],
        time: []
    };
    public averageEchartDatas: any = {
        aveTime: [],
        keys: [],
        label: ['aveTime'],
        time: []
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
    private snapShotSub: Subscription;
    public startBtnDisabled = false;
    // stack trace部分
    public stackTranceData: Array<TiTreeNode> = [];
    private isStopRefresh: any = null;
    public currentSql: string;
    public noDadaInfo: string;
    private MdbDatas = {};

    public startDate = '';

    public tip1Context: any;
    public isStart = true;
    private isStopFlag = true;

    public expandFlag = false;

    public isDownload = false;

    private expandNodes: any = {};
    public snapCount = 0;
    public snapCountTotal = 5;
    private timeLimit = 3;
    public isLoading: boolean;
    public mongdbTimeout: any = null;
    private originData: any;  // 保存未排序的表格数据
    private sortIndex: number = null;
    public noDataTip: any;
    /**
     * 组件初始化
     */
    ngOnInit() {
        this.downloadService.clearTabs.currentTabPage = this.i18n.protalserver_profiling_tab.mongodb;
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
        this.excutedEchartDatas.keys = [
            {
                label: this.i18n.protalserver_profiling_jdbc.exec_statement,
                unit: this.i18n.common_term_jdbc_times
            }
        ];
        this.averageEchartDatas.keys = [
            {
                label: this.i18n.protalserver_profiling_jdbc.aver_exec_time,
                unit: ' ms'
            }
        ];
        this.timeLimit = this.downloadService.dataLimit.mongodb.timeValue;
        this.groupId = Utils.generateConversationId(12);
        this.noDadaInfo = this.i18n.common_term_task_nodata;
        this.startBtnDisabled = JSON.parse((self as any).webviewSession.getItem('isProStop'));
        this.threshold.label = this.i18n.protalserver_profiling_http_threshold;
        this.mongodbGroup.controls.mongodb_threshold.setValue(
            this.downloadService.dataSave.mongodbThreshold);
        this.isStart = this.downloadService.dataSave.isMongodbStart;
        this.mdbBtnTip = this.i18n.protalserver_profiling_mongodb.btn_tip;
        this.mdbThresholdTip = this.i18n.protalserver_profiling_http_threshold_tip;
        if (this.snapShot) { return; }

        this.handleSnapShotCount('mongodb');
        this.jvmId = (self as any).webviewSession.getItem('jvmId');
        this.guardianId = (self as any).webviewSession.getItem('guardianId');

        this.isStopMsgSub = this.msgService.getMessage().subscribe((msg) => {
            if (msg.type === 'isStopPro') {
                this.isStart = false;
                this.startBtnDisabled = true;
                this.clearMongdbTimer();
                clearInterval(this.isStopRefresh);
                this.isStopRefresh = null;
            }
        });

        // 订阅收集快照消息
        this.snapShotSub = this.msgService.getMessage().subscribe((msg) => {
            if (msg.type === 'getSnapShot') {
                // 收集快照
                this.doSnap('mongodb');
            }
        });
        this.data = this.mapDownloadTree(this.downloadService.downloadItems.mongodb.hotspot);
        for (const item of this.data) {
            item.isShow = true;
            this.durationTotal += item.duration;
        }

        setTimeout(() => {
            this.getCountProportion();
        }, 0);
        this.mapDownlaodEcharts(this.downloadService.downloadItems.mongodb.monitor.data);

        this.isDownload = JSON.parse((self as any).webviewSession.getItem('downloadProfile') || 'false');
        if (this.isDownload) {
            this.mongodbGroup.controls.mongodb_threshold.setValue(
                this.downloadService.downloadItems.mongodb.threshold);
            this.startDate = this.downloadService.downloadItems.mongodb.monitor.startDate;
            this.noDataTip = this.i18n.common_term_task_nodata;
            return;
        } else {
            this.noDataTip = this.i18n.plugins_perf_java_profileNoData.mongoDBNoDataMsg;
        }

        let startTime = 0;

        setTimeout(() => {
            this.stompService.mdbSub = this.msgService.getMessage().subscribe((msg) => {
                if (msg.type === 'mongodb') {
                    if (msg.data) {
                        this.clearMongdbTimer();
                    }
                    this.processData(msg.data);
                    if (startTime === 0) {
                        startTime = msg.data[0].start;
                    }
                }
            });
            this.stompService.updataMdbSub = this.msgService
                .getMessage()
                .subscribe((msg) => {
                    if (msg.type === 'dataLimit' && msg.data.name === 'mongodb') {
                        this.timeLimit = msg.data.value;
                        Object.keys(this.excutedEchartDatas).forEach((item) => {
                            this.excutedEchartDatas[item] = [];
                        });
                        Object.keys(this.averageEchartDatas).forEach((item) => {
                            this.averageEchartDatas[item] = [];
                        });
                    }
                    if (msg.type === 'updata_mongodb') {
                        this.updateData(msg.data);
                        this.updateDownloadItems();
                    }
                    if (msg.type === 'isClear' || msg.type === this.i18n.protalserver_profiling_tab.mongodb) {
                        if (msg.type === 'isClear') {
                            this.setDataOnInit();
                        }
                        this.srcData.data = [
                            {
                                aver: '',
                                children: [],
                                count: 0,
                                duration: 0,
                                id: '',
                                insCountWidth: 0,
                                isShow: false,
                                isShowTip: false,
                                label: '',
                                label_name: '',
                                stackTraces: {},
                                totalDurPer: '',
                            }
                        ];
                        this.timeData = [];
                        this.mapDownlaodEcharts(this.downloadService.downloadItems.mongodb.monitor.data);
                        if ((self as any).webviewSession.getItem('tuningOperation') === 'hypertuner') {
                            this.snapCount = 0;
                        }
                        this.data = [];
                        this.MdbDatas = {};
                        this.echartDatas.time1 = [];
                        this.echartItems.forEach((item) => {
                            this.echartDatas[item] = [];
                        });
                    }
                });
        }, 1000);
    }

      /**
       * 数据初始化
       */
      public setDataOnInit(){
        this.downloadService.downloadItems.mongodb = {
          threshold: 50,
          snapCount: 0,
          hotspot: [],
          monitor: {
            startDate: '',
            data: {}
          },
        };
      }

    /**
     * 微调器回填初始化
     */
    public setSpinnerBlur() {
        this.mongodbBlur = {
            control: this.mongodbGroup.controls.mongodb_threshold,
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

    /**
     * 获取缓存的数据渲染echart图表
     * @param data 数据源
     */
    private mapDownlaodEcharts(data: any) {
        const keys = Object.keys(data);
        const series: any[] = [];
        const xAxis = [];
        const excutedSeries: any[] = [];
        const excutedXAxis: any[] = [];
        const averageSeries: any[] = [];
        const averageXAxis: any[] = [];
        this.echartDatas.time = JSON.parse(JSON.stringify(keys));
        this.excutedEchartDatas.time = JSON.parse(JSON.stringify(keys));
        this.averageEchartDatas.time = JSON.parse(JSON.stringify(keys));
        this.timeData = this.echartDatas.time;
        keys.forEach((key) => {
            this.echartDatas.executed.push(data[key].averCount);
            this.echartDatas.aveTime.push(data[key].averTime);
            this.excutedEchartDatas.executed.push(data[key].averCount);
            this.averageEchartDatas.aveTime.push(data[key].averTime);
        });
        this.echartItems.forEach((item) => {
            series.push({
                data: this.echartDatas[item]
            });
            xAxis.push({
                data: this.echartDatas.time
            });

            if (this.excutedEchartDatas[item]) {
                excutedSeries.push({
                    data: this.excutedEchartDatas[item]
                });
                excutedXAxis.push({
                    data: this.excutedEchartDatas.time
                });
            }

            if (this.averageEchartDatas[item]) {
                averageSeries.push({
                    data: this.averageEchartDatas[item]
                });
                averageXAxis.push({
                    data: this.averageEchartDatas.time
                });
            }
        });
        xAxis.push({
            data: this.echartDatas.time
        });
        this.updateOptions = {
            series,
            xAxis
        };

        this.excutedUpdateOptions = {
            series: excutedSeries,
            xAxis: excutedXAxis,
            groupId: this.groupId,
        };
        this.avarageUpdateOptions = {
            series: averageSeries,
            xAxis: averageXAxis,
            groupId: this.groupId,
        };
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
    }

    private processData(data: any) {
        let srcDatas = [];
        const newMongodb = JSON.parse(JSON.stringify(this.MdbDatas));
        data.forEach((item: any) => {
            this.durationTotal += item.duration;
            this.handle(newMongodb, item);
        });
        this.MdbDatas = newMongodb;
        srcDatas = this.defaultSort(Object.values(newMongodb));
        this.data = [...srcDatas];
        if (this.first) {
            this.getCountProportion();
            this.first = false;
        }

    }

    private handle(mdb: any, itemData: any) {
        const sql = itemData.sql;
        const duration = itemData.duration;
        if (!mdb[sql]) {
            mdb[sql] = {
                label: sql,
                duration: 0,
                count: 0,
                aver: 0,
                id: sql,
                isShow: true,
                stackTraces: { label_name: 'root', label: 'root', count: 0 }
            };
        }
        mdb[sql].duration += duration;
        mdb[sql].count++;
        mdb[sql].aver = (mdb[sql].duration / mdb[sql].count / 1000).toFixed(2);
        if (itemData.stackTraces.length) { this.merge(mdb[sql].stackTraces, itemData.stackTraces, itemData); }
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
                const pId = node.id || itemData.sql;
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
            node = sameChild;
        });
    }
    private updateData(data: any) {

        // 根据滚动条是否出现来设置echart图表右边距
        const mainEle = document.getElementsByClassName('main')[0];
        if (mainEle.scrollHeight > mainEle.clientHeight) {
            this.echartGridRight = 32;
        } else {
            this.echartGridRight = 24;
        }

        const series = [];
        const xAxis = [];
        const excutedSeries: any[] = [];
        const excutedXAxis: any[] = [];
        const averageSeries: any[] = [];
        const averageXAxis: any[] = [];
        this.startDate = this.dateFormat(data.endTime, 'yyyy-MM-dd');
        const endTime = this.dateFormat(data.endTime, 'hh:mm:ss');
        // 删除超出限制的数据的老数据
        let outNumber = this.echartDatas.executed.length - 20 * this.timeLimit;
        if (outNumber > 0) { this.echartDatas.time.splice(0, outNumber); }
        this.echartDatas.time.push(endTime);
        this.timeData = this.echartDatas.time;
        if (this.timeLineDetail) {
            this.timeLineDetail.setTimeData(this.timeData);
        }
        outNumber = this.excutedEchartDatas.executed.length - 20 * this.timeLimit;
        if (outNumber > 0) { this.excutedEchartDatas.time.splice(0, outNumber); }
        this.excutedEchartDatas.time.push(endTime);

        outNumber = this.averageEchartDatas.aveTime.length - 20 * this.timeLimit;
        if (outNumber > 0) { this.averageEchartDatas.time.splice(0, outNumber); }
        this.averageEchartDatas.time.push(endTime);

        this.echartItems.forEach((item) => {
            outNumber = this.echartDatas[item].length - 20 * this.timeLimit;
            if (outNumber > 0) {
                this.echartDatas[item].splice(0, outNumber);
            }
            this.echartDatas[item].push(data[item]);
            series.push({
                data: this.echartDatas[item]
            });
            xAxis.push({
                data: this.echartDatas.time
            });

            if (this.excutedEchartDatas[item]) {
                outNumber = this.excutedEchartDatas[item].length - 20 * this.timeLimit;
                if (outNumber > 0) {
                    this.excutedEchartDatas[item].splice(0, outNumber);
                }
                this.excutedEchartDatas[item].push(data[item]);
                excutedSeries.push({
                    data: this.excutedEchartDatas[item]
                });
                excutedXAxis.push({
                    data: this.excutedEchartDatas.time
                });
            }

            if (this.averageEchartDatas[item]) {
                outNumber = this.averageEchartDatas[item].length - 20 * this.timeLimit;
                if (outNumber > 0) {
                    this.averageEchartDatas[item].splice(0, outNumber);
                }
                this.averageEchartDatas[item].push(data[item]);
                averageSeries.push({
                    data: this.averageEchartDatas[item]
                });
                averageXAxis.push({
                    data: this.averageEchartDatas.time
                });
            }
        });

        const grid: any[] = [];
        this.excutedEchartDatas.keys.forEach((item: any, index: number) => {
            grid.push({
                height: this.gridHeight,
                left: 65,
                top: (self as any).webviewSession.getItem('tuningOperation') === 'hypertuner'
                    ? 60 : this.baseTop + this.gridHeight * index + 20,
                right: this.echartGridRight
            });
        });

        this.excutedUpdateOptions = {
            series: excutedSeries,
            xAxis: excutedXAxis,
            groupId: this.groupId,
            grid
        };
        this.avarageUpdateOptions = {
            series: averageSeries,
            xAxis: averageXAxis,
            groupId: this.groupId,
            grid
        };

    }

    /**
     * 时间轴变化数据改变
     */
    public timeLineData(event: any) {
        this.timeLine = event;
        this.excutedEchart.upDateTimeLine(event);
        this.averageEchart.upDateTimeLine(event);
    }

    /**
     * 数据筛选时间轴改变
     */
    public dataZoom(e: any) {
        this.timeLineDetail.dataConfig(e);
    }

    /**
     * ngAfterContentInit
     */
    ngAfterContentInit(): void {
        setTimeout(() => {
            this.getCountProportion();
        }, 0);
        fromEvent(window, 'resize').subscribe(event => {
            this.getCountProportion();
        });
    }

    private getCountProportion() {
        if (this.data.length === 0) { return; }
        this.data.forEach((item: any) => {
            if (this.durationTotal > 0) {
                item.insCountWidth = (item.duration / this.durationTotal) * this.insCountTotal;
                item.totalDurPer = item.duration / 1000 +
                    '(' + ((item.duration / this.durationTotal) * 100).toFixed(2) + '%)';
            }
            item.isShowTip = (item.insCountWidth + item.totalDurPer.length * 8) >= this.columnsWidth2;
            this.srcData.data.push(JSON.parse(JSON.stringify(item)));
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

    /**
     * startMongodb
     */
    startMongodb() {
        this.isLoading = true;
        if (this.startBtnDisabled || this.snapShot) { return; }
        this.isStopFlag = true;
        this.stompService.startStompRequest('/cmd/start-instrument-mongodb', {
            jvmId: this.jvmId,
            guardianId: this.guardianId,
            threshold: this.mongodbGroup.controls.mongodb_threshold.value * 1000
        });
        this.isStart = !this.isStart;
        this.downloadService.dataSave.mongodbThreshold = this.mongodbGroup.controls.mongodb_threshold.value;
        this.downloadService.dataSave.isMongodbStart = true;
        this.mongdbTimeout = setTimeout(() => {
            const message = {
                cmd: 'showInfoBox',
                data: {
                    info: this.i18n.profileNodataTip.mongodb,
                    type: 'warn'
                }
            };
            this.vscodeService.postMessage(message, null);
        }, 30000);
        // 启动mongodb分析时会停止http分析
        this.downloadService.dataSave.isHttpStart = false;
        setTimeout(() => {
            clearInterval(this.stompService.httpTimer);
            this.stompService.httpTimer = null;
        }, this.stompService.httpStep);

        if (this.stompService.mdbTimer) {
            this.isStopFlag = false;
            clearInterval(this.stompService.mdbTimer);
            this.stompService.mdbTimer = null;
        }
        this.refreshTableData();
        this.stompService.mdbTimer = setInterval(() => {
            this.stompService.mdbUpdata();
        }, this.stompService.jdbcStep);
        setTimeout(() => {
            this.isLoading = false;  // 等获取到数据再执行
        }, 4000);
    }

    /**
     * stopMongodb
     */
    stopMongodb() {
        this.stompService.startStompRequest('/cmd/stop-instrument-mongodb', {
            jvmId: this.jvmId,
            guardianId: this.guardianId
        });
        this.isStart = !this.isStart;
        this.downloadService.dataSave.isMongodbStart = false;
        this.clearMongdbTimer();
        if (!this.isStopFlag) {
            this.isStopFlag = true;
            return;
        }
        clearInterval(this.stompService.mdbTimer);
        this.stompService.mdbTimer = null;
        clearInterval(this.isStopRefresh);
        this.isStopRefresh = null;
    }

    /**
     * 将数据更新到导出数据对象中
     */
    private updateDownloadItems() {
        this.downloadService.downloadItems.mongodb.hotspot = this.downloadClone(this.data);
        this.downloadService.downloadItems.mongodb.monitor.data = this.handleDownloadData();
        this.downloadService.downloadItems.mongodb.threshold =
            this.mongodbGroup.controls.mongodb_threshold.value;
        this.downloadService.downloadItems.mongodb.monitor.startDate = this.startDate;
    }

    /**
     * 传送expandNodes数据
     */
    public send_ExpandData(e: any) {
        this.expandNodes = e;
    }

    /**
     * ngOnDestroy
     */
    ngOnDestroy(): void {
        if (this.isDownload || this.snapShot) { return; }
        if (this.snapShotSub) { this.snapShotSub.unsubscribe(); }
        if (this.isStopMsgSub) { this.isStopMsgSub.unsubscribe(); }
        if (this.stompService.mdbSub) { this.stompService.mdbSub.unsubscribe(); }
        if (this.stompService.updataMdbSub) { this.stompService.updataMdbSub.unsubscribe(); }
        this.downloadService.dataSave.isMongodbStart = this.isStart;
    }

    /**
     * 将有层级结构的数据扁平化
     * @param pArray: 父级数据， pLevel: 父级层数
     */
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
            if (this.durationTotal > 0) {
                temp.insCountWidth = (temp.duration / this.durationTotal) * this.insCountTotal;
                temp.totalDurPer = temp.duration / 1000 +
                    '(' + ((temp.duration / this.durationTotal) * 100).toFixed(2) + '%)';
            }
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

    private deepClone(obj: any): any { // 深拷贝，类似于1.x中的angular.copy()
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
        this.echartDatas.time.forEach((item: any, idx: number) => {
            downloadData[item] = {
                averTime: this.echartDatas.aveTime[idx],
                averCount: this.echartDatas.executed[idx]
            };
        });
        return downloadData;
    }

    private defaultSort(datas: any[]) {
        const sortedArr = datas.sort((a, b) => {
            return b.count - a.count;
        });
        return sortedArr;
    }

    private dateFormat(date: any, fmt: any) {
        const getDate = new Date(date);
        const o = {
            'M+': getDate.getMonth() + 1,
            'd+': getDate.getDate(),
            'h+': getDate.getHours(),
            'm+': getDate.getMinutes(),
            's+': getDate.getSeconds(),
            'q+': Math.floor((getDate.getMonth() + 3) / 3),
            S: getDate.getMilliseconds()
        };
        if (/(y+)/.test(fmt)) {
            fmt = fmt.replace(
                RegExp.$1,
                (getDate.getFullYear() + '').substr(4 - RegExp.$1.length)
            );
        }
        for (const k in o) {
            if (new RegExp('(' + k + ')').test(fmt)) {
                fmt = fmt.replace(
                    RegExp.$1,
                    RegExp.$1.length === 1
                        ? (o as any)[k]
                        : ('00' + (o as any)[k]).substr(('' + (o as any)[k]).length)
                );
            }
        }
        return fmt;
    }

    /**
     * 弹出右下角提示消息
     * @param info info
     * @param type 提示类型
     */
    showInfoBox(info: any, type: any) {
        const message = {
            cmd: 'showInfoBox',
            data: {
                info,
                type
            }
        };
        this.vscodeService.postMessage(message, null);
    }

    /**
     * 快照点击事件
     * @param property property
     */
    public compare(property: any) {
        return (a: any, b: any) => {
            const value1 = a[property];
            const value2 = b[property];
            return value2 - value1;
        };
    }

    /**
     * doSnap
     * @param type type
     */
    public doSnap(type: any) {
        if (this.isDownload) { return; }
        if (this.data.length < 1) {
            const message = {
                cmd: 'showInfoBox',
                data: {
                    info: this.i18n.snapshot_analysis_noData,
                    type: 'warn'
                }
            };
            this.vscodeService.postMessage(message, null);
            return;
        }

        if (this.snapCount < this.snapCountTotal) {
            const tableTop = this.downloadClone(this.data);
            const nowTime = this.getSnapTime();
            const snapShot = this.downloadService.downloadItems.snapShot.snapShotData &&
                JSON.parse(this.downloadService.downloadItems.snapShot.snapShotData) || {};
            if (!snapShot[type]) {
                snapShot[type] = {
                    label: this.i18n.protalserver_profiling_tab.mongodb,
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
                        threshold: this.mongodbGroup.controls.mongodb_threshold.value,
                        durationTotal: this.durationTotal,
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
            this.downloadService.downloadItems.mongodb.snapCount = this.snapCount + 1;
            if ((self as any).webviewSession.getItem('tuningOperation') === 'hypertuner') {
                this.vscodeService.showTuningInfo(this.i18n.snapshot_success_alert, 'info', 'ioSnapshot');
            } else {
                this.showInfoBox(this.i18n.snapshot_success_alert, 'info');
            }
        }
        // 更新快照次数
        this.msgService.sendMessage({
            type: 'getSnapShotCount',
        });
        this.handleSnapShotCount(type);
    }
    /**
     * getSnapTime
     */
    public getSnapTime() {
        const date = new Date().toLocaleDateString();
        const hour = new Date().getHours() > 9 ? new Date().getHours() : '0' + new Date().getHours();
        const minute = new Date().getMinutes() > 9 ? new Date().getMinutes() : '0' + new Date().getMinutes();
        const seconds = new Date().getSeconds() > 9 ? new Date().getSeconds() : '0' + new Date().getSeconds();
        return `${date} ${hour}:${minute}:${seconds}`;
    }

    /**
     * importSnapData
     * @param snapShotData snapShotData
     */
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
        setTimeout(() => {
            this.getCountProportion();
        }, 0);

        this.isStart = false;
        this.startDate = snapShotData.echarts.startDate;
        this.snapCount = snapShotData.snapCount;
        setTimeout(() => {
            this.mongodbGroup.controls.mongodb_threshold.setValue(snapShotData.threshold);
        }, 200);
        this.mapDownlaodEcharts(snapShotData.echarts.data);
    }

    /**
     * handleSnapShotCount
     * @param type type
     */
    public handleSnapShotCount(type: any) {
        this.snapCount = this.downloadService.downloadItems[type].snapCount;
    }

    /**
     * handleIsOverSize
     * @param data data
     */
    public handleIsOverSize(data: any) {
        const newDataSize = data.length;
        const obj = (self as any).webviewSession;
        const sessionSize = 5120 * 1024;
        let size = 0;
        for (const item in obj) {
            if (obj.hasOwnProperty(item)) {
                size += obj.getItem(item).length;
            }
        }
        if (newDataSize + size > sessionSize) {
            this.showInfoBox(this.i18n.snapshot_analysis_overSize, 'warn');
            return false;
        }
        return true;
    }

    /**
     * jumpToSnapShot
     */
    public jumpToSnapShot() {
        const jvmName = (self as any).webviewSession.getItem('currentSelectJvm');
        this.router.navigate([`/profiling/${jvmName}/snapshot`]);
    }
    /**
     * 清除定时器
     */
    public clearMongdbTimer() {
        clearTimeout(this.mongdbTimeout);
        this.mongdbTimeout = null;
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
