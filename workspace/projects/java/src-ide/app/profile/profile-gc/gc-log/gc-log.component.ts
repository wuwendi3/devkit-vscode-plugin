import {
    Component, OnInit, ViewChild, ElementRef, OnDestroy,
    AfterViewInit, SecurityContext, Input, ChangeDetectorRef, NgZone
} from '@angular/core';
import { TiTableColumns, TiTableRowData, TiTableSrcData } from '@cloud/tiny3';
import { StompService } from '../../../service/stomp.service';
import { MessageService } from '../../../service/message.service';
import { I18nService } from '../../../service/i18n.service';
import { Utils } from '../../../service/utils.service';
import { Router } from '@angular/router';
import { createSvg } from '../../../util';
import { DomSanitizer } from '@angular/platform-browser';
import { VscodeService, COLOR_THEME } from '../../../service/vscode.service';
import { ProfileDownloadService } from '../../../service/profile-download.service';
import * as echarts from 'echarts/core';

@Component({
    selector: 'app-gc-log',
    templateUrl: './gc-log.component.html',
    styleUrls: ['./gc-log.component.scss']
})
export class GcLogComponent implements OnInit, OnDestroy, AfterViewInit {
    @ViewChild('cancalGCLog', { static: false }) cancalGCLog: any;
    @ViewChild('analysis ', { static: false }) analysis: any;
    @ViewChild('collectTimeLine', { static: false }) collectTimeLine: any;
    @ViewChild('gcLogTimeLine', { static: false }) gcLogTimeLine: any;
    @Input() offlineGcLogId: string;
    @Input() offlineGcLog: boolean; // 是否是从离线报告，内存转储进入
    @Input() ideType: any;
    public suggestArr: Array<any> = [];
    public hoverClose: any;
    public isSuggest = false;
    public sugtype = 1;
    public rightTitle = '';
    private KIB = 1024;
    private MIB = this.KIB * 1024;
    private tenSeconds = 10000;
    public javaEnvironment = 'java8';
    public allSuggestArr: any[] = [];
    constructor(
        private stompService: StompService,
        private msgService: MessageService,
        public i18nService: I18nService,
        private elementRef: ElementRef,
        public utils: Utils,
        public router: Router,
        public domSanitizer: DomSanitizer,
        public vscodeService: VscodeService,
        private downloadService: ProfileDownloadService,
        public changeDetectorRef: ChangeDetectorRef,
        public zone: NgZone,
    ) {
        this.i18n = this.i18nService.I18n();
    }
    public i18n: any;

    public lineColorList = [
        '#037cff',
        '#00BFC9',
        '#41BA41',
        '#e88b00',
        '#a050e7',
        '#e72e90',
        '#8cd600',
        '#f45c5e',
        '#f3689a',
        '#a97af8',
        '#4c6bc2',
        '#33b0a6'
    ];
    public keyIndicatorArray: Array<any> = [];
    public memoryUsedArray: Array<any> = [];
    // 细化分析GC暂停数据
    public GCPauseTimeArray: Array<any> = [];
    // 细化分析堆内存数据
    public GCHeapUsedData: any = {};
    public GCHeapUsedArray: Array<any> = [];

    public keyOption: any = {};
    public memoryOption: any = {};
    public memoryUsedType = 0;
    public detailInfoData: any = [];

    // GC暂停统计
    public pauseDisplayed: Array<TiTableRowData> = [];
    public pauseSrcData: TiTableSrcData;
    public pauseColumns: Array<TiTableColumns> = [];
    // GC成因
    public causeDisplayed: Array<TiTableRowData> = [];
    public causeSrcData: TiTableSrcData;
    public causeColumns: Array<TiTableColumns> = [];
    public pieData: any = [];
    private pieColor: any = ['#037dff', '#00bfc9', '#41BA41', '#e88b00', '#a050e7', '#e72e90', '#8cd600'];
    public causeEcharts: any;
    // G1采集阶段统计
    public collectDisplayed: Array<TiTableRowData> = [];
    public collectSrcData: TiTableSrcData;
    public collectColumns: Array<TiTableColumns> = [];
    public colTableColumns: Array<TiTableColumns> = [];
    public timeData: any = [];
    public echartsOption: any = {};
    public echartsInstance: any;
    public collectEchartsInstance: any;
    public noDadaInfo: string;

    public pauseAndMemoryData: Array<any>;
    public detailInfo: any = '';
    public serialYoungColumns: Array<any> = [];
    public serialInitColumns: Array<any> = [];
    public serialHybridColumns: Array<any> = [];
    // 串行阶段数据
    public serialPhaseData: TiTableSrcData;
    public parallelPhaseData: TiTableSrcData;
    public serialDisplayed: Array<TiTableRowData> = [];
    public parallelDisplayed: Array<TiTableRowData> = [];
    public comitansColumns: Array<any> = [];
    public pointeTypes: Array<any> = [];
    public serialTypes: Array<any> = [];
    public parallelTypes: Array<any> = [];

    public initMarkData = {};
    public mixedData = {};
    public youngData = {};
    public detailData: any;
    public showData: any;

    public isDownload = false;
    public startBtnDisabled: any;
    public showLoading = false;
    public generateID: any;
    public showProgress: any = true;
    public gcTimeData: any = [];
    public segmentation: any = [];
    public markLineData: any = [];
    public language: any;
    public currentCollectState: any;
    public collectState: any;
    public showCancalBtn: any = true;
    public progress: any = 0;
    public barLength: any = 0;
    public showNodate = false;
    public analyzID: string;
    public selectOptions: any = [];
    public selectValue: any;
    public metricsData: any = {
        throughput: '',
        gcOverhead: '',
        avgLinearity: '',
        avgPauseTime: '',
        maxPauseTime: ''
    };
    public guardianId: any;
    public lineColor = '#4b4b4b';
    public toolTipBG = '#424242';
    public textColor = '#e8e8e8';
    public titleColor = '#aaaaaa';
    public jvmId: any;
    public gcLogId: any;
    public isFinished = false;
    public currTheme = COLOR_THEME.Dark;
    public ColorTheme = {
        Dark: COLOR_THEME.Dark,
        Light: COLOR_THEME.Light
    };
    public pluginUrlCfg: any = {
        gcloghelpUrl: ''
    };
    /**
     * OnInit
     */
    ngOnInit() {
        if (((self as any).webviewSession || {}).getItem('tuningOperation') === 'hypertuner') {
            this.ideType = 'intellij';
          } else {
            this.ideType = 'other';
          }
        // vscode颜色主题
        if (document.body.className.indexOf('vscode-light') !== -1) {
            this.currTheme = COLOR_THEME.Light;
            this.lineColor = '#aaaaaa';
            this.toolTipBG = '#ffffff';
            this.textColor = '#222222';
            this.titleColor = '#616161';
        }
        this.vscodeService.regVscodeMsgHandler('colorTheme', (msg: any) => {
            this.currTheme = msg.colorTheme;
            setTimeout(() => {
                if (this.currTheme === COLOR_THEME.Dark) {
                    this.lineColor = '#4b4b4b';
                    this.toolTipBG = '#424242';
                    this.textColor = '#e8e8e8';
                    this.titleColor = '#aaaaaa';
                } else {
                    this.lineColor = '#aaaaaa';
                    this.toolTipBG = '#ffffff';
                    this.textColor = '#222222';
                    this.titleColor = '#616161';
                }
            }, 200);
        });
        // 获取全局url配置数据
        this.vscodeService.postMessage({ cmd: 'readURLConfig' }, (resp: any) => {
            this.pluginUrlCfg = resp;
        });
        this.keyOption = {
            dataZoom: [],
        };

        this.jvmId = (self as any).webviewSession.getItem('jvmId');
        this.guardianId = (self as any).webviewSession.getItem('guardianId');
        this.setPauseAndMemoryTab();
        this.selectOptions = [
            {
                label: this.i18n.protalserver_profiling_gc_log.showType.key,
                type: 'key'
            },
            {
                label: this.i18n.protalserver_profiling_gc_log.showType.cause,
                type: 'cause'
            },
            {
                label: this.i18n.protalserver_profiling_gc_log.showType.detail,
                type: 'detail'
            }
        ];
        this.pauseColumns = [
            { title: 'durationTime', width: '33%', },
            { title: 'pause', width: '33%' },
            { title: 'percent', width: '33%' }
        ];
        this.causeColumns = [
            { title: 'reason', width: '20%' },
            { title: 'count', width: '15%', isSort: true, sortKey: 'count' },
            { title: 'aver', width: '15%', isSort: true, sortKey: 'avgTime' },
            { title: 'max', width: '15%', isSort: true, sortKey: 'maxTime' },
            { title: 'total', width: '15%', isSort: true, sortKey: 'totalTime' },
            { title: 'per', width: '20%', isSort: true, sortKey: 'timePercent' }
        ];
        this.collectColumns = [
            [
                { title: 'type', rowspan: 2, width: '10%' },
                { title: 'young', colspan: 7, width: '70%' },
                {
                    title: 'hybrid', rowspan: 2, width: '10%',
                    tip: this.i18n.protalserver_profiling_gc_log.collect_table.tip
                },
                { title: 'gc', rowspan: 2, width: '10%' },
            ],
            [
                { title: 'young_recycle', tip: this.i18n.protalserver_profiling_gc_log.collect_table.tip },
                { title: 'origin', tip: this.i18n.protalserver_profiling_gc_log.collect_table.tip },
                { title: 'scan' },
                { title: 'tag' },
                { title: 're_tag' },
                { title: 'clean' },
                { title: 'con_clean' }
            ]
        ];
        this.pointeTypes = [
            this.i18n.protalserver_profiling_gc_log.detailInfo.count,
            this.i18n.protalserver_profiling_gc_log.detailInfo.totalTime,
            this.i18n.protalserver_profiling_gc_log.detailInfo.averageTime,
            this.i18n.protalserver_profiling_gc_log.detailInfo.averageTimeOffset,
            this.i18n.protalserver_profiling_gc_log.detailInfo.minAndMaxTime,
            this.i18n.protalserver_profiling_gc_log.detailInfo.averageIntervalTime,
        ];
        this.serialTypes = [
            this.i18n.protalserver_profiling_gc_log.serialPointeType.maxTime,
            this.i18n.protalserver_profiling_gc_log.serialPointeType.minTime,
            this.i18n.protalserver_profiling_gc_log.serialPointeType.averageTime,
            this.i18n.protalserver_profiling_gc_log.serialPointeType.sumTime,
        ];
        this.parallelTypes = [
            this.i18n.protalserver_profiling_gc_log.parallelPointeType.maxTime,
            this.i18n.protalserver_profiling_gc_log.parallelPointeType.minTime,
            this.i18n.protalserver_profiling_gc_log.parallelPointeType.averageTime,
            this.i18n.protalserver_profiling_gc_log.parallelPointeType.diffTime,
        ];
        this.colTableColumns = this.flat(this.collectColumns).filter(column => !column.colspan);
        this.rightTitle = this.i18n.protalserver_profiling_gc_log.memory_table.pauseTime;
        this.pauseSrcData = {
            data: [],
            state: {
                searched: false,
                sorted: false,
                paginated: true
            }
        };
        this.causeSrcData = {
            data: [],
            state: {
                searched: false,
                sorted: false,
                paginated: true
            }
        };
        this.collectSrcData = {
            data: [],
            state: {
                searched: false,
                sorted: false,
                paginated: true
            }
        };
        this.serialPhaseData = {
            data: [],
            state: {
                searched: false,
                sorted: false,
                paginated: true
            }
        };
        this.parallelPhaseData = {
            data: [],
            state: {
                searched: false,
                sorted: false,
                paginated: true
            }
        };
        this.suggestArr = this.downloadService.downloadItems.gclog.suggestArr;
        // 设置串行阶段表格格式
        this.getSerialPhaseTable();
        // 设置并行阶段表格格式
        this.getComitansPhaseTable();

        if (this.offlineGcLog) {
            this.startBtnDisabled = true;
            this.isFinished = true;
            this.showLoading = false;
            this.selectValue = this.selectOptions[0];
            this.getMetrics();
            this.getOfflineSuggest();
            this.getPauseInterval();
            this.getLinearity();
            this.getGCCauses();
            // 获取G1采集阶段统计数据
            this.getGatherPhase();
            // 获取GC暂停数据
            this.getGCPauseTime();
            // 获取堆内存占用变化数据
            this.getHeapMemoryUsedData();
            return;
        }
        this.downloadService.clearTabs.currentTabPage = this.i18n.protalserver_profiling_tab.gcLog;
        this.isDownload = JSON.parse((self as any).webviewSession.getItem('downloadProfile') || 'false');
        this.startBtnDisabled = JSON.parse((self as any).webviewSession.getItem('isProStop'));
        const language = ((self as any).webviewSession || {}).getItem('language');
        this.language = language && language.indexOf('en') !== -1 ? false : true;

        if (this.downloadService.downloadItems.gclog.isFinished) {
            this.handleDataFromCache();
        } else {
            if (!(self as any).webviewSession.getItem('gcLogState')) {
                this.startBtnDisabled = true;
                this.gcLogCheck();
            }
        }

        this.handleGCCollectState();

        // 监听GC日志消息
        this.getLogMessage();
        this.updateWebViewPage();
    }

    /**
     * 下载缺失包
     * @param url 路径
     */
    openUrl(url: string) {
        // intellij走该逻辑
        if (((self as any).webviewSession || {}).getItem('tuningOperation') === 'hypertuner'){
            this.vscodeService.postMessage({
                cmd: 'openHyperlinks',
                data: {
                    hyperlinks: url
                }
            }, null);
        } else {
            const a = document.createElement('a');
            a.setAttribute('href', url);
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }
    }
    /**
     * 缓存GC日志采集状态
     */
    public handleGCCollectState() {
        if ((self as any).webviewSession.getItem('gcLogState')) {
            // 切回CG日志页面时判断采集状态
            let gcLogDetail = (self as any).webviewSession.getItem('gcLogState');
            if (gcLogDetail) {
                gcLogDetail = JSON.parse(gcLogDetail);
                this.gcLogId = gcLogDetail.gcLogRecord.id;
                const collectState = gcLogDetail.gcLogRecord.state;
                if (collectState && this.gcLogId) {
                    this.showLoading = true;

                    this.analyzID = Utils.generateConversationId(8);
                    const path = this.currTheme === COLOR_THEME.Dark ? './assets/img/collecting/dark/loading-dark.json'
                        : './assets/img/collecting/light/loading-light.json';
                    setTimeout(() => {
                        createSvg('#' + this.analyzID, path);
                    }, 10);

                    if (collectState === 'PARSE_COMPLETED') { // 解析完成
                        this.currentCollectState = 'PARSE_COMPLETED';
                        this.isFinished = true;
                        this.showLoading = false;
                        this.startBtnDisabled = false;
                        this.selectValue = this.selectOptions[0];
                        this.getMetrics();
                        this.getPauseInterval();
                        this.getLinearity();
                        this.getGCCauses();

                        // 获取G1采集阶段统计数据
                        this.getGatherPhase();
                        // 获取GC暂停数据
                        this.getGCPauseTime();
                        // 获取堆内存占用变化数据
                        this.getHeapMemoryUsedData();
                    } else if (collectState === 'FAILED') { // 需要中断交互解析的异常
                        this.currentCollectState = 'FAILED';
                        (this.vscodeService as any).showInfoBox(gcLogDetail.errorMessage, 'warn');
                        this.isFinished = false;
                        this.startBtnDisabled = false;
                        this.showLoading = false;
                        this.showNodate = true;
                    } else if (this.currentCollectState === 'WARN') { // 不需要中断交互的警告提示
                        (this.vscodeService as any).showInfoBox(gcLogDetail.errorMessage, 'warn');
                    }
                }
            }
        }
    }

    /**
     * 设置暂停时长和内存占用变化的tab
     */
    public setPauseAndMemoryTab() {
        this.pauseAndMemoryData = [
            {
                title: this.i18n.protalserver_profiling_gc_log.memory_table.pauseTime,
                id: 0,
                active: true,
            },
            {
                title: this.i18n.protalserver_profiling_gc_log.memory_table.heapState,
                id: 1,
                active: false,
            },
            {
                title: this.i18n.protalserver_profiling_gc_log.memory_table.oldState,
                id: 2,
                active: false,
            },
            {
                title: this.i18n.protalserver_profiling_gc_log.memory_table.edenState,
                id: 3,
                active: false,
            },
            {
                title: this.i18n.protalserver_profiling_gc_log.memory_table.surviorState,
                id: 4,
                active: false,
            },
            {
                title: this.i18n.protalserver_profiling_gc_log.memory_table.originDate,
                id: 5,
                active: false,
            },
        ];
    }
    /**
     * 设置饼图option
     */
    public setPieOption() {
        if (echarts) {
            this.causeEcharts = echarts.init(this.elementRef.nativeElement.querySelector('#causeEchart'));
            const timePercent = '{' + 'time|' + this.i18n.protalserver_profiling_gc_log.gcTimePercent + '}';
            this.causeEcharts.setOption({
                tooltip: {
                    borderWidth: 0,
                    trigger: 'item',
                    backgroundColor: this.toolTipBG,
                    textStyle: {
                        color: this.textColor,
                    },
                    position: ['50%', '50%'],
                    formatter: (params: any): any => {
                        if (params) {
                            let html = ``;
                            html += `<div>
                            <div>
                                <span style='display: inline-block;
                                width: 8px;height: 8px;background-color:${params.color};
                                margin-right: 4px;margin-top:-2px;'>
                                </span>
                                ${params.name}
                            </div>`;
                            html += `
                        <div style='margin-top:2px;display:flex;justify-content: space-between; align-items: center;'>
                        <div style="float:left;">
                          <div style='display:inline-block;'>${params.percent.toFixed(2) + '%'}</div></div>
                          </div>
                          `;
                            html += `</div>`;
                            return html;
                        }
                    }
                },
                series: [
                    {
                        name: '',
                        type: 'pie',
                        radius: ['60%', '70%'],
                        avoidLabelOverlap: true,
                        label: {
                            formatter: [
                                '{percent|100%}',
                                timePercent,
                            ].join('\n'),
                            position: 'center',
                            rich: {
                                percent: {
                                    color: this.textColor, // 黑白版动态设置颜色
                                    fontSize: 24,
                                    height: 40
                                },
                                time: {
                                    fontSize: 12,
                                    color: this.titleColor, // 黑白版动态设置颜色
                                },
                            }
                        },
                        emphasis: {
                            scale: false
                        },
                        labelLine: {
                            show: false
                        },
                        data: this.pieData
                    }
                ]
            });
        }
    }
    /**
     * 页面初始化完成
     */
    ngAfterViewInit() {
        // 作页面缓存
        if (this.downloadService.downloadItems.gclog.isFinished) {
            this.setOptions();
            this.memoryUsedSetOptions();
            if (this.selectValue.type === 'cause') {
                this.setPieOption();
            }
        }
        this.updateWebViewPage();
    }
    // 从缓存中拿数据
    public handleDataFromCache() {
        if (this.downloadService.downloadItems && this.downloadService.downloadItems.gclog) {
            this.isFinished = this.downloadService.downloadItems.gclog.isFinished;
            this.showNodate = this.downloadService.downloadItems.gclog.showNodate;
            this.keyIndicatorArray = this.downloadService.downloadItems.gclog.keyIndicatorArray;
            this.metricsData = this.downloadService.downloadItems.gclog.metricsData;
            this.causeSrcData = this.downloadService.downloadItems.gclog.causeSrcData;
            this.pieData = this.downloadService.downloadItems.gclog.pieData;
            this.selectValue = this.downloadService.downloadItems.gclog.selectValue;
            this.pauseSrcData = this.downloadService.downloadItems.gclog.pauseSrcData;
            this.GCPauseTimeArray = this.downloadService.downloadItems.gclog.GCPauseTimeArray;
            this.memoryUsedArray = this.downloadService.downloadItems.gclog.memoryUsedArray;
            this.collectSrcData = this.downloadService.downloadItems.gclog.collectSrcData;
            this.GCHeapUsedData = this.downloadService.downloadItems.gclog.GCHeapUsedData;
            this.GCHeapUsedArray = this.downloadService.downloadItems.gclog.GCHeapUsedArray;
            this.showData = this.downloadService.downloadItems.gclog.showData;
        }
    }
    // 把数据存入缓存
    public handleDataToCache() {
        if (this.downloadService.downloadItems && this.downloadService.downloadItems.gclog) {
            this.downloadService.downloadItems.gclog.isFinished = this.isFinished;
            this.downloadService.downloadItems.gclog.showNodate = this.showNodate;
            this.downloadService.downloadItems.gclog.keyIndicatorArray = this.keyIndicatorArray;
            this.downloadService.downloadItems.gclog.metricsData = this.metricsData;
            this.downloadService.downloadItems.gclog.causeSrcData = this.causeSrcData;
            this.downloadService.downloadItems.gclog.pieData = this.pieData;
            this.downloadService.downloadItems.gclog.selectValue = this.selectValue;
            this.downloadService.downloadItems.gclog.pauseSrcData = this.pauseSrcData;
            this.downloadService.downloadItems.gclog.GCPauseTimeArray = this.GCPauseTimeArray;
            this.downloadService.downloadItems.gclog.memoryUsedArray = this.memoryUsedArray;
            this.downloadService.downloadItems.gclog.collectSrcData = this.collectSrcData;
            this.downloadService.downloadItems.gclog.GCHeapUsedData = this.GCHeapUsedData;
            this.downloadService.downloadItems.gclog.GCHeapUsedArray = this.GCHeapUsedArray;
            this.downloadService.downloadItems.gclog.showData = this.showData;
        }
    }

    ngOnDestroy() {
        if (this.stompService.gcLog) {
            this.stompService.gcLog.unsubscribe();
        }
        this.setPauseAndMemoryTab();
        this.downloadService.downloadItems.gclog.suggestArr = this.suggestArr;
        this.detailInfo = '';
        this.handleDataToCache();
        this.msgService.sendMessage({ type: 'getDeleteOne' });  // 清除本页面的发送事件
    }
    // 设置串行阶段表格表头数据
    public getSerialPhaseTable() {
        this.serialYoungColumns = [
            [
                { title: 'type', rowspan: 2, width: '7%' },
                { title: 'pre', colspan: 2, width: '14%' },
                { title: 'evacuate', rowspan: 2, width: '7%' },
                { title: 'post', colspan: 9, width: '63%' },
                { title: 'other', rowspan: 2, width: '7%' },
            ],
            [
                { title: 'choose', width: '7%' },
                { title: 'humongous', width: '7%' },
                { title: 'failure', width: '7%' },
                { title: 'fixup', width: '7%' },
                { title: 'clear', width: '7%' },
                { title: 'reference', width: '7%' },
                { title: 'weak', width: '7%' },
                { title: 'purge', width: '7%' },
                { title: 'redirty', width: '7%' },
                { title: 'free', width: '7%' },
                { title: 'reclaim', width: '7%' }
            ]
        ];
        this.serialInitColumns = [
            [
                { title: 'type', rowspan: 2, width: '7.6%' },
                { title: 'parallel', rowspan: 2, width: '7.6%' },
                { title: 'fixup', rowspan: 2, width: '7.6%' },
                { title: 'purge', rowspan: 2, width: '7.6%' },
                { title: 'clear', rowspan: 2, width: '7.6%' },
                { title: 'other', colspan: 8, width: '60.8%' },
            ],
            [
                { title: 'failure', width: '7.6%' },
                { title: 'choose', width: '7.6%' },
                { title: 'refProc', width: '7.6%' },
                { title: 'refEnq', width: '7.6%' },
                { title: 'redirty', width: '7.6%' },
                { title: 'register', width: '7.6%' },
                { title: 'reclaim', width: '7.6%' },
                { title: 'free', width: '7.6%' },
            ]
        ];
    }
    // 获取并行阶段表头数据
    public getComitansPhaseTable() {
        this.comitansColumns = [
            { title: 'type', width: '12.5%' },
            { title: 'exit', width: '12.5%' },
            { title: 'update', width: '12.5%' },
            { title: 'scan', width: '12.5%' },
            { title: 'code', width: '12.5%' },
            { title: 'object', width: '12.5%' },
            { title: 'termination', width: '12.5%' },
            { title: 'gcWorker', width: '12.5%' },
        ];
    }
    // 获取年轻代回收、初始标记、混合阶段详情数据
    private getdetailData(data: any) {
        let title = '';
        if (this.detailInfo === 'young_recycle') {
            title = this.i18n.protalserver_profiling_gc_log.collect_table.young_recycle;
        } else if (this.detailInfo === 'hybrid') {
            title = this.i18n.protalserver_profiling_gc_log.collect_table.hybrid;
        } else {
            title = this.i18n.protalserver_profiling_gc_log.collect_table.origin;
        }
        this.detailInfoData = [

            {
                title: this.i18n.protalserver_profiling_gc_log.detailInfo.collectPhase,
                value: title,
            },
            {
                title: this.i18n.protalserver_profiling_gc_log.detailInfo.count,
                value: data && data.times ? data.times : '--',
            },
            {
                title: this.i18n.protalserver_profiling_gc_log.detailInfo.totalTime,
                value: data && data.sumUsedTime ? data.sumUsedTime : '--',
            },
            {
                title: this.i18n.protalserver_profiling_gc_log.detailInfo.averageTime,
                value: data && data.avgUsedTime ? data.avgUsedTime : '--',
            },
            {
                title: this.i18n.protalserver_profiling_gc_log.detailInfo.averageTimeOffset,
                value: data && data.avgSd ? data.avgSd : '--',
            },
            {
                title: this.i18n.protalserver_profiling_gc_log.detailInfo.minAndMaxTime,
                value: data && data.minUsedTime ? data.minUsedTime + '/' + data.maxUsedTime : '--',
            },
            {
                title: this.i18n.protalserver_profiling_gc_log.detailInfo.averageIntervalTime,
                value: data && data.avgInterval ? data.avgInterval : '--',
            },
        ];
    }
    // 详情页面返回到活动细化分析页面
    public comeToBack() {
        this.selectValue.type = 'detail';
        this.detailInfo = '';
    }

    /**
     * 设置关键指标分析option
     */
    public setOptions() {
        const yongGCArr: any = [];
        const initialMarkArr: any = [];
        const againMarkArr: any = [];
        const clearArr: any = [];
        const mixGCArr: any = [];
        const fullGCArr: any = [];
        const allArr: any = [];
        const maxDataArr: any = [];
        const time: any = [];
        let toolTipDate: any = '';
        this.keyIndicatorArray.forEach(item => {
            const allData = {
                name: '',
                value: '',
            };
            if (item.pausePhase === 'young') {
                yongGCArr.push((Number(item.linearity) * 100).toFixed(2));
                allData.name = this.i18n.protalserver_profiling_gc_log.keyAnalysisType.yongGC;
            } else {
                yongGCArr.push('');
            }
            if (item.pausePhase === 'mixed') {
                mixGCArr.push((Number(item.linearity) * 100).toFixed(2));
                allData.name = this.i18n.protalserver_profiling_gc_log.keyAnalysisType.mixGC;
            } else {
                mixGCArr.push('');
            }
            if (item.pausePhase === 'FullGC') {
                allData.name = this.i18n.protalserver_profiling_gc_log.keyAnalysisType.fullGC;
                fullGCArr.push((Number(item.linearity) * 100).toFixed(2));
            } else {
                fullGCArr.push('');
            }
            if (item.pausePhase === 'initial-mark') {
                initialMarkArr.push((Number(item.linearity) * 100).toFixed(2));
                allData.name = this.i18n.protalserver_profiling_gc_log.keyAnalysisType.initialMark;
            } else {
                initialMarkArr.push('');
            }
            if (item.pausePhase === 'remark') {
                againMarkArr.push((Number(item.linearity) * 100).toFixed(2));
                allData.name = this.i18n.protalserver_profiling_gc_log.keyAnalysisType.retryMark;
            } else {
                againMarkArr.push('');
            }
            if (item.pausePhase === 'cleanup') {
                clearArr.push((Number(item.linearity) * 100).toFixed(2));
                allData.name = this.i18n.protalserver_profiling_gc_log.keyAnalysisType.clear;
            } else {
                clearArr.push('');
            }
            time.push(item.uptime);
            allData.value = (Number(item.linearity) * 100).toFixed(2);
            allArr.push(allData);
            maxDataArr.push((Number(item.linearity) * 100).toFixed(2));
        });
        this.timeData = time;
        toolTipDate = this.utils.dateFormat(new Date(this.keyIndicatorArray[0].startTime), 'yyyy/MM/dd');
        this.downloadService.dataSave.toolTipDate = toolTipDate;
        const maxValue = Math.ceil(Math.max.apply(null, maxDataArr)) + 1;
        const lineType: any = {};
        lineType[this.i18n.protalserver_profiling_gc_log.keyAnalysisType.yongGC] = false;
        lineType[this.i18n.protalserver_profiling_gc_log.keyAnalysisType.initialMark] = false;
        lineType[this.i18n.protalserver_profiling_gc_log.keyAnalysisType.retryMark] = false;
        lineType[this.i18n.protalserver_profiling_gc_log.keyAnalysisType.clear] = false;
        lineType[this.i18n.protalserver_profiling_gc_log.keyAnalysisType.mixGC] = false;
        lineType[this.i18n.protalserver_profiling_gc_log.keyAnalysisType.fullGC] = false;
        lineType[this.i18n.protalserver_profiling_gc_log.keyAnalysisType.all] = true;

        const legendData = [
            {
                name: this.i18n.protalserver_profiling_gc_log.keyAnalysisType.yongGC,
                itemStyle: {
                    color: this.lineColorList[0]
                }
            },
            {
                name: this.i18n.protalserver_profiling_gc_log.keyAnalysisType.initialMark,
                itemStyle: {
                    color: this.lineColorList[1]
                }
            },
            {
                name: this.i18n.protalserver_profiling_gc_log.keyAnalysisType.retryMark,
                itemStyle: {
                    color: this.lineColorList[2]
                }
            },
            {
                name: this.i18n.protalserver_profiling_gc_log.keyAnalysisType.clear,
                itemStyle: {
                    color: this.lineColorList[3]
                }
            },
            {
                name: this.i18n.protalserver_profiling_gc_log.keyAnalysisType.mixGC,
                itemStyle: {
                    color: this.lineColorList[4]
                }
            },
            {
                name: this.i18n.protalserver_profiling_gc_log.keyAnalysisType.fullGC,
                itemStyle: {
                    color: this.lineColorList[5]
                }
            },
            {
                name: this.i18n.protalserver_profiling_gc_log.keyAnalysisType.all,
                itemStyle: {
                    color: this.lineColorList[6]
                }
            }
        ];
        const option = {
            title: {
                text: this.i18n.protalserver_profiling_gc_log.linearity,
                textStyle: {
                    color: this.titleColor,
                    fontSize: 14,
                    fontWeight: 'normal',
                },
                left: 0,
            },
            tooltip: {
                borderWidth: 0,
                trigger: 'axis',
                axisPointer: {
                    type: 'line',
                    label: {
                        backgroundColor: '#6a7985'
                    }
                },
                backgroundColor: this.toolTipBG,
                borderRadius: 5,
                padding: [8, 20, 8, 20],
                boxShadow: 'rgba(0, 0, 0, 0.5)',
                textStyle: {
                    color: this.textColor,
                    fontSize: 12
                },
                extraCssText: 'box-shadow: 0px 4px 8px 0px rgba(0, 0, 0, .2);',
                formatter: (params: any): any => {
                    if (params.length) {
                        let html = ``;
                        html += `<div><div>${this.i18n.protalserver_profiling_gc_log.systemTime +
                            params[0].axisValueLabel}</div>
                          `;
                        params.forEach((param: any, index: any) => {
                            if ((param.data || param.data === 0) || (param.data.value || param.data.value === 0)) {
                                html += `
                                <div style='margin-top:8px;display:flex;justify-content: space-between;
                                 align-items: center;'>
                                    <div style="float:left;">
                                        <div style="display: inline-block;width: 8px;height: 8px;
                                            background-color: ${params[index].color};margin-right: 8px;"></div>
                                        <div style='display:inline-block;'>
                                            ${this.domSanitizer.sanitize(SecurityContext.HTML,
                                    this.handleSeriesName(param))}</div>
                                    </div>
                                    <div style='margin-left:24px;display:inline-block;'>
                                        ${this.domSanitizer.sanitize(SecurityContext.HTML,
                                        this.handleSeriesData(param))}
                                    </div>
                                </div>
                                `;
                            }
                        });
                        html += `</div>`;
                        return html;
                    }
                }
            },
            legend: {
                itemHeight: 8,
                itemWidth: 8,
                icon: 'rect',
                textStyle: {
                    color: this.textColor,
                },
                selected: lineType,
                data: legendData,
                x: 'right',
                padding: [
                    5,  // 上
                    5, // 右
                    70,  // 下
                    5, // 左
                ]
            },
            dataZoom: [
                {
                    type: 'inside',
                    realtime: true,
                    showDataShadow: false
                }
            ],
            grid: {
                top: '8%',
                left: '20',
                right: '40',
                bottom: '0%',
                containLabel: true
            },
            xAxis: [
                {
                    type: 'category',
                    data: time,
                    boundaryGap: false,
                    axisTick: {
                        alignWithLabel: true,
                        show: true
                    },
                    axisLabel: {
                        align: 'center',
                        textStyle: {
                            color: this.textColor,
                        }
                    },
                    axisLine: {
                        lineStyle: {
                            color: this.lineColor,
                            width: '1'
                        }
                    }
                }
            ],
            yAxis: [
                {
                    type: 'value',
                    axisLabel: {
                        formatter: '{value}',
                        textStyle: {
                            color: this.textColor,
                        }
                    },
                    splitLine: {
                        show: true,
                        lineStyle: {
                            type: 'dashed',
                            color: this.lineColor,
                        }
                    },
                    max: maxValue,
                    min: 0,
                    axisLine: {
                        lineStyle: {
                            color: this.lineColor,
                            width: '1'
                        }
                    }
                }
            ],
            series: [
                {
                    name: this.i18n.protalserver_profiling_gc_log.keyAnalysisType.yongGC,
                    type: 'line',
                    stack: 'yongGCArr',
                    lineStyle: {
                        color: this.lineColorList[0]
                    },
                    connectNulls: true,
                    itemStyle: {
                        normal: {
                            color: this.lineColorList[0]
                        }
                    },
                    showSymbol: false,
                    symbolSize: 6,
                    data: yongGCArr
                },
                {
                    name: this.i18n.protalserver_profiling_gc_log.keyAnalysisType.initialMark,
                    type: 'line',
                    stack: 'initialMarkArr',
                    lineStyle: {
                        color: this.lineColorList[1]
                    },
                    connectNulls: true,
                    itemStyle: {
                        normal: {
                            color: this.lineColorList[1]
                        }
                    },
                    showSymbol: false,
                    symbolSize: 6,
                    data: initialMarkArr
                },
                {
                    name: this.i18n.protalserver_profiling_gc_log.keyAnalysisType.retryMark,
                    type: 'line',
                    stack: 'againMarkArr',
                    lineStyle: {
                        color: this.lineColorList[2]
                    },
                    connectNulls: true,
                    itemStyle: {
                        normal: {
                            color: this.lineColorList[2]
                        }
                    },
                    showSymbol: false,
                    symbolSize: 6,
                    data: againMarkArr
                },
                {
                    name: this.i18n.protalserver_profiling_gc_log.keyAnalysisType.clear,
                    type: 'line',
                    stack: 'clearArr',
                    lineStyle: {
                        color: this.lineColorList[3]
                    },
                    connectNulls: true,
                    itemStyle: {
                        normal: {
                            color: this.lineColorList[3]
                        }
                    },
                    showSymbol: false,
                    symbolSize: 6,
                    data: clearArr
                },
                {
                    name: this.i18n.protalserver_profiling_gc_log.keyAnalysisType.mixGC,
                    type: 'line',
                    stack: 'mixGCArr',
                    lineStyle: {
                        color: this.lineColorList[4]
                    },
                    connectNulls: true,
                    itemStyle: {
                        normal: {
                            color: this.lineColorList[4]
                        }
                    },
                    showSymbol: false,
                    symbolSize: 6,
                    data: mixGCArr
                },
                {
                    name: this.i18n.protalserver_profiling_gc_log.keyAnalysisType.fullGC,
                    type: 'line',
                    stack: 'fullGCArr',
                    lineStyle: {
                        color: this.lineColorList[5]
                    },
                    connectNulls: true,
                    itemStyle: {
                        normal: {
                            color: this.lineColorList[5]
                        }
                    },
                    showSymbol: false,
                    symbolSize: 6,
                    data: fullGCArr
                },
                {
                    name: this.i18n.protalserver_profiling_gc_log.keyAnalysisType.all,
                    type: 'line',
                    stack: 'allArr',
                    connectNulls: true,
                    lineStyle: {
                        color: this.lineColorList[6]
                    },
                    itemStyle: {
                        normal: {
                            color: this.lineColorList[6]
                        }
                    },
                    showSymbol: false,
                    symbolSize: 6,
                    data: allArr
                }
            ]
        };
        this.keyOption = option;
        this.sortTime(time);
        this.updateWebViewPage();
    }

    // 处理tooltip显示的类名
    private handleSeriesName(param: any) {
        if (param.seriesName === this.i18n.protalserver_profiling_gc_log.keyAnalysisType.all) {
            const subStr = this.i18n.protalserver_profiling_gc_log.totalData;
            return subStr + '(' + param.data.name + ')';
        } else {
            return param.seriesName;
        }
    }
    // 处理tooltip显示的数据
    private handleSeriesData(param: any) {
        if (param.seriesName === this.i18n.protalserver_profiling_gc_log.keyAnalysisType.all) {
            const paradata = (param.data.value || Number(param.data.value) === 0) ? param.data.value + '%' : '';
            return paradata;
        } else {
            const paradata = (param.value || Number(param.value) === 0) ? param.data + '%' : '';
            return paradata;
        }
    }

    /**
     * 时间排序
     */
    public sortTime(time: any) {
        if (time) {
            const arr = time
                .map((item: any) => {
                    return item;
                })
                .sort();
            const oddTime: any = [];
            const newTime = arr.map((item: any, index: any) => {
                oddTime[index] = '';
                for (let i = 0; i < item.length; i++) {
                    oddTime[index] += item[i];
                    if (i === 1 || i === 3) {
                        oddTime[index] += ':';
                    }
                }
                return oddTime[index];
            });
            return newTime;
        }
    }

    /**
     * 时间轴操作-GC暂停&内存占用变化
     */
    public timeLineData(event: any) {
        this.memoryOption.dataZoom[0].start = event.start;
        this.memoryOption.dataZoom[0].end = event.end;
        this.echartsInstance.setOption({
            dataZoom: this.memoryOption.dataZoom
        });
    }

    /**
     * 时间轴操作-线性度分类采集
     */
    public collectTimeLineData(event: any) {
        this.keyOption.dataZoom[0].start = event.start;
        this.keyOption.dataZoom[0].end = event.end;
        this.collectEchartsInstance.setOption({
            dataZoom: this.keyOption.dataZoom
        });
        this.updateWebViewPage();
    }

    /**
     * 处理echart缩放-GC暂停&内存占用变化
     */
    public handleDatazoom(event: any) {
        this.gcLogTimeLine.dataConfig({
            start: event.batch[0].start,
            end: event.batch[0].end,
        });
    }

    /**
     * 处理echart缩放-线性度分类采集
     */
    public collectHandleDatazoom(event: any) {
        this.collectTimeLine.dataConfig({
            start: event.batch[0].start,
            end: event.batch[0].end,
        });
    }

    private gcLogCheck() {
        this.noDadaInfo = '';
        const lvmid = (self as any).webviewSession.getItem('lvmid');
        const url = `/guardians/${encodeURIComponent(this.guardianId)}/startGcPreCheck/${encodeURIComponent(lvmid)}`;
        this.vscodeService.post({ url }, (resp: any) => {
            if (resp.code === 0) {
                this.showNodate = true;
                this.startBtnDisabled = false;
            } else if (resp.code === -2) {
                this.showNodate = true;
                this.startBtnDisabled = true;
                (this.vscodeService as any).showInfoBox(resp.message, 'warn');
            } else {
                this.showNodate = true;
                this.startBtnDisabled = true;
                this.noDadaInfo = resp.message;
            }
            this.updateWebViewPage();
        });
    }
    private getLogMessage() {
        (this.stompService as any).gcLog = this.msgService.getMessage().subscribe(msg => {
            if (msg.type === 'gcLog') {
                this.gcLogId = msg.data.gcLogRecord.id;
                this.currentCollectState = msg.data.gcLogRecord.state;
                if (this.currentCollectState === 'PARSE_COMPLETED') { // 解析完成
                    this.isFinished = true;
                    this.showNodate = false;
                    this.showLoading = false;
                    this.selectValue = this.selectOptions[0];
                    this.getMetrics();
                    this.getPauseInterval();
                    this.getLinearity();
                    this.getGCCauses();

                    // 获取G1采集阶段统计数据
                    this.getGatherPhase();
                    // 获取GC暂停数据
                    this.getGCPauseTime();
                    // 获取堆内存占用变化数据
                    this.getHeapMemoryUsedData();
                } else if (this.currentCollectState === 'FAILED') { // 需要中断交互解析的异常
                    (this.vscodeService as any).showInfoBox(msg.data.errorMessage, 'warn');
                    this.isFinished = false;
                    this.showLoading = false;
                    this.showNodate = true;
                } else if (this.currentCollectState === 'WARN') { // 不需要中断交互的警告提示
                    (this.vscodeService as any).showInfoBox(msg.data.errorMessage, 'warn');
                }
            }
            if (msg.type === 'setDeleteOne') {
                if (this.showNodate || this.showLoading) {
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
            if (msg.type === 'isClear' || msg.type === this.i18n.protalserver_profiling_tab.gcLog) {
                this.initData();
            }
            if (msg.type === 'isStopPro') {
                this.startBtnDisabled = true;
            }
            if (msg.type === 'isRestart') {
                this.startBtnDisabled = false;
                this.suggestArr = [];
                this.initData();
            }
            if (msg.type === 'exportData') {
                this.handleDataToCache();
            }
            if (msg.type === 'suggest') {
                this.suggestArr = [];
                this.suggestArr = msg.data.filter((item: any) => {
                    return item.label === 5;
                });
                this.downloadService.downloadItems.gclog.suggestArr = this.suggestArr;
                this.getSuggestTip();
            }
            // 保存内存转储
            if (msg.type === 'savedGClogReoprt') {
                this.savedGClogReport(msg.data);
            }
        });
        if (this.suggestArr.length > 0) {
            this.getSuggestTip();
        }
    }
    // 获取优化建议
    public getSuggestTip() {
        if (this.offlineGcLog) {
            this.allSuggestArr = this.suggestArr;
        } else {
            this.allSuggestArr = this.downloadService.downloadItems.profileInfo.allSuggestArr;
        }
    }
    /**
     * 保存内存转储
     */
    savedGClogReport(data: any) {
        const params = {
            gcLogId: this.gcLogId,
            logName: data.reportName,
            source: 'SELF_COLLECTION',
            comment: data.reportRemark
        };
        const option = {
            url: `/guardians/${this.guardianId}/gcLogRecord/`,
            params
        };
        this.vscodeService.post(option, (res: any) => {
            if (((self as any).webviewSession || {}).getItem('tuningOperation') === 'hypertuner') {
                if (res.code === 0) {
                    this.vscodeService.postMessage({
                        cmd: 'savedReportShowInfo', data: {
                            taskId: res.data.id,
                            type: 'gclog'
                        }
                    }, null);
                    this.vscodeService.showTuningInfo(res.message, 'info', 'saveData');
                } else {
                    this.vscodeService.showTuningInfo(res.message, 'warn', 'saveData');
                }
            } else {
                if (res.code === 0) {
                    this.vscodeService.postMessage({
                        cmd: 'savedReportShowInfo', data: {
                            taskId: res.data.id,
                            reportData: res.data,
                            type: 'gclog'
                        }
                    }, null);
                } else {
                    this.showInfoBox(res.message, 'warn');
                }
            }
            this.updateWebViewPage();
        });
    }
    private initData() {
        this.suggestArr = [];
        this.showNodate = true;
        this.showLoading = false;
        this.isFinished = false;
        this.causeSrcData.data = [];
        this.pauseSrcData.data = [];
        this.pieData = {};
        this.timeData = [];
        this.keyOption = {};
        this.currentCollectState = '';
        this.detailInfoData = [];
        this.memoryOption = {};
        this.detailInfo = '';
    }
    /**
     * GC数据采集
     */
    public refreshData() {
        this.showNodate = false;
        this.showLoading = true;
        this.isFinished = false;
        this.suggestArr = [];
        const allSuggests = this.downloadService.downloadItems.profileInfo.suggestArr.filter((sug: any) => {
            return sug.label !== 5;
        });
        this.downloadService.downloadItems.profileInfo.suggestArr = allSuggests;

        this.msgService.sendMessage({
            type: 'deleteGcLogSuggest'
        });

        this.analyzID = Utils.generateConversationId(8);
        const path = this.currTheme === COLOR_THEME.Dark ? './assets/img/collecting/dark/loading-dark.json'
            : './assets/img/collecting/light/loading-light.json';
        setTimeout(() => {
            createSvg('#' + this.analyzID, path);
        }, 10);
        this.stompService.startStompRequest(
            '/cmd/start-gcLog-parse',
            { jvmId: this.jvmId, guardianId: this.guardianId }
        );
    }


    // 跳转到不同的细化分析详情页面
    public toDetailInfo(item: any) {
        this.detailInfo = item.title;
        // 获取年轻代回收、初始标记、混合阶段数据
        let phase = '';
        let phaseData: any;
        if (item.title === 'young_recycle') {
            phase = 'young';
            phaseData = this.youngData;
        } else if (item.title === 'origin') {
            phase = 'initial-mark';
            phaseData = this.initMarkData;
        } else {
            phase = 'mixed';
            phaseData = this.mixedData;
        }
        this.detailData = phaseData;

        this.getdetailData(phaseData);
        this.getGCSerialData(phase);
        this.getGCParallelData(phase);
    }
    // G1 GC关键性指标
    private getMetrics() {
        const gId = encodeURIComponent(this.guardianId);
        const gcLogId = encodeURIComponent(this.gcLogId);
        let url: string;
        if (this.offlineGcLog) {
            url = `/gcLog/${encodeURIComponent(this.offlineGcLogId)}/metrics`;
        } else {
            url = `/guardians/${gId}/jvms/${encodeURIComponent(this.jvmId)}/gclog/${gcLogId}/metrics`;
        }
        this.vscodeService.get({ url }, (resp: any) => {
            if (resp.code === 0) {
                this.metricsData = resp.data;
            } else {
                this.showInfoBox(resp.message, 'error');
            }
        });
    }
    // 暂停时长区间分布
    private getPauseInterval() {
        const gId = encodeURIComponent(this.guardianId);
        const jvmId = encodeURIComponent(this.jvmId);
        let url: string;
        if (this.offlineGcLog) {
            url = `/gcLog/${encodeURIComponent(this.offlineGcLogId)}/pauseinterval`;
        } else {
            url = `/guardians/${gId}/jvms/${jvmId}/gclog/${encodeURIComponent(this.gcLogId)}/pauseinterval`;
        }
        this.vscodeService.get({ url }, (resp: any) => {
            if (resp.code === 0) {
                this.pauseSrcData.data = resp.data;
            } else {
                this.showInfoBox(resp.message, 'error');
            }
        });
    }
    // GC线程线性度
    private getLinearity() {
        const gId = encodeURIComponent(this.guardianId);
        const jvmId = encodeURIComponent(this.jvmId);
        let url: string;
        if (this.offlineGcLog) {
            url = `/gcLog/${encodeURIComponent(this.offlineGcLogId)}/linearity`;
        } else {
            url = `/guardians/${gId}/jvms/${jvmId}/gclog/${encodeURIComponent(this.gcLogId)}/linearity`;
        }
        this.vscodeService.get({ url }, (resp: any) => {
            if (resp.code === 0) {
                this.keyIndicatorArray = resp.data;
                this.downloadService.downloadItems.gclog.keyIndicatorArray = this.keyIndicatorArray;
                this.setOptions();
            } else {
                this.showInfoBox(resp.message, 'error');
            }
        });
    }
    // GC成因分析
    private getGCCauses() {
        const gId = encodeURIComponent(this.guardianId);
        const jvmId = encodeURIComponent(this.jvmId);
        let url: string;
        if (this.offlineGcLog) {
            url = `/gcLog/${encodeURIComponent(this.offlineGcLogId)}/gccauses`;
        } else {
            url = `/guardians/${gId}/jvms/${jvmId}/gclog/${encodeURIComponent(this.gcLogId)}/gccauses`;
        }
        this.vscodeService.get({ url }, (resp: any) => {
            if (resp.code === 0) {
                this.causeSrcData.data = resp.data;
                this.downloadService.downloadItems.gclog.causeSrcData = this.causeSrcData;
                const pieData = JSON.parse(JSON.stringify(resp.data));
                // 饼图移除总计
                const totalIndex = pieData.findIndex((item: any) => {
                    return item.cause === 'total';
                });
                if (totalIndex >= 0) {
                    pieData.splice(totalIndex, 1);
                }
                pieData.forEach((item: any, index: number) => {
                    item.name = item.cause;
                    item.value = item.timePercent;
                    item.itemStyle = {
                        color: this.pieColor[index]
                    };
                });
                this.pieData = pieData;
            } else {
                this.showInfoBox(resp.message, 'error');
            }
        });
    }
    // G1采集阶段统计
    private getGatherPhase() {
        const gId = encodeURIComponent(this.guardianId);
        const jvmId = encodeURIComponent(this.jvmId);
        let url: string;
        if (this.offlineGcLog) {
            url = `/gcLog/${encodeURIComponent(this.offlineGcLogId)}/phasestatistic`;
        } else {
            url = `/guardians/${gId}/jvms/${jvmId}/gclog/${encodeURIComponent(this.gcLogId)}/phasestatistic`;
        }
        this.vscodeService.get({ url }, (resp: any) => {
            if (resp.code === 0) {
                const data: any = this.dataConvert(resp.data);
                const maxUsedTimeObj = data.maxUsedTime;
                for (const [key, val] of Object.entries(maxUsedTimeObj)) {
                    // 处理时间单位
                    maxUsedTimeObj[key] = this.timeChange(data.minUsedTime[key], true) +
                        '/' + this.timeChange(val, true);
                }
                const tempData: any = [];
                tempData[0] = data.times;
                tempData[1] = data.sumUsedTime;
                tempData[2] = data.avgUsedTime;
                tempData[3] = data.avgSd;
                tempData[4] = maxUsedTimeObj;
                tempData[5] = data.avgInterval;
                // 处理时间单位转换
                tempData.forEach((item: any, index: any) => {
                    if (index > 0 && index !== 4) {
                        for (const key in item) {
                            if (Object.prototype.hasOwnProperty.call(item, key)) {
                                item[key] = this.timeChange(item[key], true);
                            }
                        }
                    }
                });
                this.collectSrcData.data = tempData;

                if (resp.data) {
                    this.youngData = this.autoChangeTimeUnit(resp.data.young);
                    this.mixedData = this.autoChangeTimeUnit(resp.data.mixed);
                    this.initMarkData = this.autoChangeTimeUnit(resp.data['initial-mark']);
                }
            } else {
                this.showInfoBox(resp.message, 'error');
            }
        });
    }
    // 查看报告时获取优化建议
    private getOfflineSuggest() {
        let url: string;
        if (this.offlineGcLog) {
            url = `/gcLog/${encodeURIComponent(this.offlineGcLogId)}/suggestions`;
        }
        this.vscodeService.get({ url }, (resp: any) => {
            if (resp.code === 0) {
                this.suggestArr = resp.data;
                this.getSuggestTip();
            } else {
                this.showInfoBox(resp.message, 'error');
            }
        });
    }
    // gc暂停时长
    private getGCPauseTime() {
        const gId = encodeURIComponent(this.guardianId);
        const jvmId = encodeURIComponent(this.jvmId);
        let url: string;
        if (this.offlineGcLog) {
            url = `/gcLog/${encodeURIComponent(this.offlineGcLogId)}/gcpause`;
        } else {
            url = `/guardians/${gId}/jvms/${jvmId}/gclog/${encodeURIComponent(this.gcLogId)}/gcpause`;
        }
        this.vscodeService.get({ url }, (resp: any) => {
            if (resp.code === 0) {
                this.GCPauseTimeArray = resp.data;
                this.showData = resp.data.length > 0 ? true : false;
                this.memoryUsedSetOptions();
            } else {
                this.showInfoBox(resp.message, 'error');
            }
        });
    }
    // 获取堆内存占用变化数据
    private getHeapMemoryUsedData() {
        const gId = encodeURIComponent(this.guardianId);
        const jvmId = encodeURIComponent(this.jvmId);
        let url: string;
        if (this.offlineGcLog) {
            url = `/gcLog/${encodeURIComponent(this.offlineGcLogId)}/memory`;
        } else {
            url = `/guardians/${gId}/jvms/${jvmId}/gclog/${encodeURIComponent(this.gcLogId)}/memory`;
        }
        this.vscodeService.get({ url }, (resp: any) => {
            if (resp.code === 0) {
                this.GCHeapUsedData = resp.data;
                this.GCHeapUsedArray = resp.data.memoryInfoList;
            } else {
                this.showInfoBox(resp.message, 'error');
            }
        });
    }
    // 获取串行阶段数据
    private getGCSerialData(phase: any) {
        const phaseType = phase;
        const gId = encodeURIComponent(this.guardianId);
        const jvmId = encodeURIComponent(this.jvmId);
        let url: string;
        if (this.offlineGcLog) {
            url = `/gcLog/${encodeURIComponent(this.offlineGcLogId)}/phase/${phaseType}/serial`;
        } else {
            url = `/guardians/${gId}/jvms/${jvmId}/gclog/${this.gcLogId}/phase/${phaseType}/serial`;
        }
        this.vscodeService.get({ url }, (resp: any) => {
            if (resp.code === 0) {
                const tempData: any = [];
                if (JSON.stringify(resp.data) !== '{}') {
                    // 判断是Java8环境还是Java11环境
                    if (resp.data.codeRootFixup && resp.data.codeRootFixup.tag && resp.data.codeRootFixup.tag === 'E') {
                        this.javaEnvironment = 'java8';
                    } else {
                        this.javaEnvironment = 'java11';
                    }
                    const data: any = this.dataConvert(resp.data);
                    tempData[0] = data.maxUsedTime;
                    tempData[1] = data.minUsedTime;
                    tempData[2] = data.avgUsedTime;
                    tempData[3] = data.sumUsedTime;

                    // 处理时间单位转换
                    tempData.forEach((item: any, index: any) => {
                        for (const key in item) {
                            if (Object.prototype.hasOwnProperty.call(item, key)) {
                                item[key] = this.timeChange(item[key], true);
                            }
                        }
                    });
                }
                this.serialPhaseData.data = tempData;
            } else {
                this.showInfoBox(resp.message, 'error');
            }
        });
    }
    // 获取并行阶段数据
    private getGCParallelData(phase: any) {
        const phaseType = phase;

        const gId = encodeURIComponent(this.guardianId);
        const jvmId = encodeURIComponent(this.jvmId);
        let url: string;
        if (this.offlineGcLog) {
            url = `/gcLog/${encodeURIComponent(this.offlineGcLogId)}/phase/${phaseType}/parallel`;
        } else {
            url = `/guardians/${gId}/jvms/${jvmId}/gclog/${this.gcLogId}/phase/${phaseType}/parallel`;
        }
        this.vscodeService.get({ url }, (resp: any) => {
            if (resp.code === 0) {
                const tempData: any = [];
                if (JSON.stringify(resp.data) !== '{}') {
                    const data: any = this.dataConvert(resp.data);
                    tempData[0] = data.maxUsedTime;
                    tempData[1] = data.minUsedTime;
                    tempData[2] = data.avgUsedTime;
                    tempData[3] = data.avgDiff;

                    // 处理时间单位转换
                    tempData.forEach((item: any, index: any) => {
                        for (const key in item) {
                            if (Object.prototype.hasOwnProperty.call(item, key)) {
                                item[key] = this.timeChange(item[key], true);
                            }
                        }
                    });
                }
                this.parallelPhaseData.data = tempData;
            } else {
                this.showInfoBox(resp.message, 'error');
            }
        });
    }
    // 时间单位换算
    public timeChange(timeStr: any, lessSec?: boolean) {
        return this.utils.timeAutoChange(timeStr, lessSec);
    }
    // 把时间单位处理成相应格式
    public autoChangeTimeUnit(timeObj: any) {
        for (const key in timeObj) {
            if (Object.prototype.hasOwnProperty.call(timeObj, key)) {
                if (key !== 'times' && key !== 'phase') {
                    timeObj[key] = this.timeChange(timeObj[key], true);
                } else {
                    timeObj[key] = timeObj[key];
                }
            }
        }
        return timeObj;
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
     * 弹出右下角带按钮的提示弹窗
     * @param info info
     * @param type 提示类型
     */
    showInfoBoxWithButton(info: any, type: any) {
        const message = {
            cmd: 'showInfoBoxWithButton',
            data: {
                info,
                type,
                title1: this.i18n.jdbcpool.look,
            }
        };
        this.vscodeService.postMessage(message, null);
    }
    // 数据处理转化
    public dataConvert(data: any) {
        const result: any = {};
        for (const [key, value] of Object.entries(data)) {
            for (const [key1, val] of Object.entries(value)) {
                const obj: any = new Object();
                result[key1] = obj;
            }
            break;
        }
        for (const [key, value] of Object.entries(data)) {
            for (const [key1, val] of Object.entries(result)) {
                const obj: any = val;
                const tempValue: any = value;
                obj[key] = tempValue[key1];
            }
        }
        return result;
    }
    /**
     * 取消采集弹窗
     */
    public openCancal() {
        this.cancalGCLog.type = 'warn';
        this.cancalGCLog.alert_show();
        this.cancalGCLog.title = this.i18n.protalserver_profiling_gc_log.cancel;
        this.cancalGCLog.haveContent = false;
        this.cancalGCLog.content = this.i18n.protalserver_profiling_gc_log.cancalTip;
    }
    /**
     * 确认取消采集
     */
    public confirmHandleStop(e: any) {
        const gcLogId = encodeURIComponent(this.gcLogId);
        if (e) {
            const url = `/guardians/${encodeURIComponent(this.guardianId)}/stopGcLogParse/${gcLogId}`;
            this.vscodeService.post({ url }, (resp: any) => {
                if (resp.code === 0) {
                    this.showNodate = true;
                    this.showLoading = false;
                    (this.vscodeService as any).showInfoBox(this.i18n.protalserver_profiling_memoryDump.cancalSuccess,
                        'info');
                } else {
                    (this.vscodeService as any).showInfoBox(resp.message, 'warn');
                }
            });
        }
    }
    /**
     * 选择显示类型
     * @param option 选择项
     */
    public onSelect(option: any) {
        // 切换到活动细化分析时默认不展示详情页
        this.detailInfo = '';
        if (this.causeEcharts) {
            this.causeEcharts.clear();
        }
        if (option.type === 'cause') {
            let tempTimer = setTimeout(() => {
                this.setPieOption();
                clearTimeout(tempTimer);
                tempTimer = null;
            }, 100);
        }
    }

    /**
     * 活动细化分析操作时间轴
     */
    public timeLineOption(event: any) {
        this.memoryOption.dataZoom[0].start = event.start;
        this.memoryOption.dataZoom[0].end = event.end;
        this.echartsInstance.setOption({
            dataZoom: this.memoryOption.dataZoom
        });
    }

    /**
     * echart初始化-GC暂停&内存占用变化
     */
    public onChartInit(ec: any) {
        this.echartsInstance = ec;
    }

    /**
     * echart初始化-线性度分类采集
     */
    public onCollectChartInit(ec: any) {
        this.collectEchartsInstance = ec;
    }

    /**
     * 内存占用情况切换
     */
    public memoryUsedChange(item: any, index: any) {
        this.memoryUsedType = item.id;
        this.rightTitle = item.title;
        this.pauseAndMemoryData.forEach((value) => {
            value.active = false;
        });
        this.pauseAndMemoryData[index].active = true;
        if (this.memoryUsedType === 0) {
            this.memoryUsedArray = this.GCPauseTimeArray;
        } else {
            this.memoryUsedArray = this.GCHeapUsedArray;
        }
        this.memoryUsedSetOptions();
        this.gcLogTimeLine.dataConfig({
            start: 0,
            end: 100,
        });
    }


    /**
     * 字节单位转换
     */
    public onChangeUnit(num: number, int?: boolean) {
        return (num / this.MIB).toFixed(2);
    }
    /**
     * 设置GC暂停/内存占用option
     */
    public memoryUsedSetOptions() {
        const youngGCArr: any = [];
        const initialMarkArr: any = [];
        const mixGCArr: any = [];
        const fullGCArr: any = [];
        const heapBeforeGcUsed: any = [];
        const heapAfterGcUsed: any = [];
        const heapCommit: any = [];
        const edenBeforeGcUsed: any = [];
        const edenCommit: any = [];
        const survivorBeforeGcUsed: any = [];
        const survivorAfterGcUsed: any = [];
        const oldBeforeGcUsed: any = [];
        const oldAfterGcUsed: any = [];
        const metaspaceBeforeGcUsed: any = [];
        const metaspaceAfterGcUsed: any = [];
        const metaspaceCommit: any = [];
        const time: any = [];
        const maxDataArr: any = [];
        let seriesData: Array<any> = [];
        let toolTipDate: any = '';
        let legendNameArr: Array<any> = [];
        if (this.memoryUsedType === 0) {
            this.memoryUsedArray = this.GCPauseTimeArray;
            this.memoryUsedArray.forEach(item => {
                youngGCArr.push(item.phase === 'young' ? item.pauseTime : '');
                mixGCArr.push(item.phase === 'mixed' ? item.pauseTime : '');
                fullGCArr.push(item.phase === 'FullGC' ? item.pauseTime : '');
                initialMarkArr.push(item.phase === 'initial-mark' ? item.pauseTime : '');
                time.push(item.uptime);
                maxDataArr.push(item.pauseTime);
            });
        } else {
            this.memoryUsedArray.forEach(item => {
                heapBeforeGcUsed.push(item.heapBeforeGcUsed ? this.onChangeUnit(item.heapBeforeGcUsed) : '');
                heapAfterGcUsed.push(item.heapAfterGcUsed ? this.onChangeUnit(item.heapAfterGcUsed) : '');
                heapCommit.push(item.heapCommit ? this.onChangeUnit(item.heapCommit) : '');
                edenBeforeGcUsed.push(item.edenBeforeGcUsed ? this.onChangeUnit(item.edenBeforeGcUsed) : '');
                edenCommit.push(item.edenCommit ? this.onChangeUnit(item.edenCommit) : '');
                survivorBeforeGcUsed.push(item.survivorBeforeGcUsed ?
                    this.onChangeUnit(item.survivorBeforeGcUsed) : '');
                survivorAfterGcUsed.push(item.survivorAfterGcUsed ?
                    this.onChangeUnit(item.survivorAfterGcUsed) : '');
                oldBeforeGcUsed.push(item.oldBeforeGcUsed ? this.onChangeUnit(item.oldBeforeGcUsed) : '');
                oldAfterGcUsed.push(item.oldAfterGcUsed ? this.onChangeUnit(item.oldAfterGcUsed) : '');
                if (item.metaspaceCommit !== null) {
                    metaspaceCommit.push(this.onChangeUnit(item.metaspaceCommit));
                } else {
                    metaspaceCommit.push('');
                }
                if (item.metaspaceBeforeGcUsed !== null) {
                    metaspaceBeforeGcUsed.push(this.onChangeUnit(item.metaspaceBeforeGcUsed));
                } else {
                    metaspaceBeforeGcUsed.push('');
                }
                if (item.metaspaceAfterGcUsed !== null) {
                    metaspaceAfterGcUsed.push(this.onChangeUnit(item.metaspaceAfterGcUsed));
                } else {
                    metaspaceAfterGcUsed.push('');
                }

                if (this.memoryUsedType === 1) {
                    this.showData = this.GCHeapUsedData?.heapUsed === true ? true : false;
                    maxDataArr.push(item.heapBeforeGcUsed);
                    maxDataArr.push(item.heapAfterGcUsed);
                    maxDataArr.push(item.heapCommit);
                } else if (this.memoryUsedType === 2) {
                    this.showData = this.GCHeapUsedData?.oldUsed === true ? true : false;
                    maxDataArr.push(item.oldBeforeGcUsed);
                    maxDataArr.push(item.oldAfterGcUsed);
                }
                else if (this.memoryUsedType === 3) {
                    this.showData = this.GCHeapUsedData?.edenUsed === true ? true : false;
                    maxDataArr.push(item.edenBeforeGcUsed);
                    maxDataArr.push(item.edenCommit);
                }
                else if (this.memoryUsedType === 4) {
                    this.showData = this.GCHeapUsedData?.survivorUsed === true ? true : false;
                    maxDataArr.push(item.survivorBeforeGcUsed);
                    maxDataArr.push(item.survivorAfterGcUsed);
                }
                else {
                    this.showData = this.GCHeapUsedData?.metaspaceUsed === true ? true : false;
                    maxDataArr.push(item.metaspaceCommit);
                    maxDataArr.push(item.metaspaceBeforeGcUsed);
                    maxDataArr.push(item.metaspaceAfterGcUsed);
                }
                time.push(item.uptime);
            });
        }

        this.timeData = time;
        toolTipDate = this.utils.dateFormat(new Date(this.memoryUsedArray[0].startTime), 'yyyy/MM/dd');
        this.downloadService.dataSave.toolTipDate = toolTipDate;
        let maxValue = 0;
        let translate = false;
        if (maxDataArr.length > 0) {
            if (this.memoryUsedType === 0) {
                maxValue = Math.ceil(Math.max.apply(null, maxDataArr)) + 1;
                // 暂停时长超过10s，将echarts的Y轴单位调整为s
                if (maxValue >= this.tenSeconds) {
                    translate = true;
                }
            } else {
                maxValue = Math.ceil(Math.max.apply(null, maxDataArr) / this.MIB) + 1;
            }
        }

        switch (this.memoryUsedType) {
            case 0:
                seriesData = [
                    {
                        name: this.i18n.protalserver_profiling_gc_log.legendName.youngGC,
                        type: 'scatter',
                        symbol: 'rect',
                        lineStyle: {
                            color: this.lineColorList[0]
                        },
                        legendHoverLink: true,
                        itemStyle: {
                            normal: {
                                color: this.lineColorList[0]
                            }
                        },
                        showSymbol: false,
                        symbolSize: 6,
                        data: youngGCArr
                    },
                    {
                        name: this.i18n.protalserver_profiling_gc_log.legendName.initMark,
                        type: 'scatter',
                        symbol: 'rect',
                        legendHoverLink: true,
                        lineStyle: {
                            color: this.lineColorList[1]
                        },
                        itemStyle: {
                            normal: {
                                color: this.lineColorList[1]
                            }
                        },
                        showSymbol: false,
                        symbolSize: 6,
                        data: initialMarkArr
                    },
                    {
                        name: this.i18n.protalserver_profiling_gc_log.legendName.mixedGC,
                        type: 'scatter',
                        symbol: 'rect',
                        legendHoverLink: true,
                        lineStyle: {
                            color: this.lineColorList[2]
                        },
                        itemStyle: {
                            normal: {
                                color: this.lineColorList[2]
                            }
                        },
                        showSymbol: false,
                        symbolSize: 6,
                        data: mixGCArr
                    },
                    {
                        name: this.i18n.protalserver_profiling_gc_log.legendName.fullGC,
                        type: 'scatter',
                        symbol: 'rect',
                        legendHoverLink: true,
                        lineStyle: {
                            color: this.lineColorList[3]
                        },
                        itemStyle: {
                            normal: {
                                color: this.lineColorList[3]
                            }
                        },
                        showSymbol: false,
                        symbolSize: 6,
                        data: fullGCArr
                    },
                ];
                legendNameArr = [
                    this.i18n.protalserver_profiling_gc_log.legendName.youngGC,
                    this.i18n.protalserver_profiling_gc_log.legendName.initMark,
                    this.i18n.protalserver_profiling_gc_log.legendName.mixedGC,
                    this.i18n.protalserver_profiling_gc_log.legendName.fullGC,
                ];
                break;
            case 1:
                seriesData = [
                    {
                        name: this.i18n.protalserver_profiling_gc_log.legendName.beforeGC,
                        type: 'line',
                        stack: 'beforeGC',
                        lineStyle: {
                            color: this.lineColorList[0]
                        },
                        connectNulls: true,
                        itemStyle: {
                            normal: {
                                color: this.lineColorList[0]
                            }
                        },
                        showSymbol: false,
                        symbolSize: 6,
                        data: heapBeforeGcUsed
                    },
                    {
                        name: this.i18n.protalserver_profiling_gc_log.legendName.afterGC,
                        type: 'line',
                        stack: 'afterGC',
                        connectNulls: true,
                        lineStyle: {
                            color: this.lineColorList[1]
                        },
                        itemStyle: {
                            normal: {
                                color: this.lineColorList[1]
                            }
                        },
                        showSymbol: false,
                        symbolSize: 6,
                        data: heapAfterGcUsed
                    },
                    {
                        name: this.i18n.protalserver_profiling_gc_log.legendName.submitHeap,
                        type: 'line',
                        stack: 'submitHeap',
                        connectNulls: true,
                        lineStyle: {
                            color: this.lineColorList[3]
                        },
                        itemStyle: {
                            normal: {
                                color: this.lineColorList[3]
                            }
                        },
                        showSymbol: false,
                        symbolSize: 6,
                        data: heapCommit
                    },
                ];
                legendNameArr = [
                    this.i18n.protalserver_profiling_gc_log.legendName.beforeGC,
                    this.i18n.protalserver_profiling_gc_log.legendName.afterGC,
                    this.i18n.protalserver_profiling_gc_log.legendName.submitHeap,
                ];
                break;
            case 2:
                seriesData = [
                    {
                        name: this.i18n.protalserver_profiling_gc_log.legendName.beforeGC,
                        type: 'line',
                        stack: 'beforeGC',
                        lineStyle: {
                            color: this.lineColorList[0]
                        },
                        connectNulls: true,
                        itemStyle: {
                            normal: {
                                color: this.lineColorList[0]
                            }
                        },
                        showSymbol: false,
                        symbolSize: 6,
                        data: oldBeforeGcUsed
                    },
                    {
                        name: this.i18n.protalserver_profiling_gc_log.legendName.afterGC,
                        type: 'line',
                        stack: 'afterGC',
                        connectNulls: true,
                        lineStyle: {
                            color: this.lineColorList[1]
                        },
                        itemStyle: {
                            normal: {
                                color: this.lineColorList[1]
                            }
                        },
                        showSymbol: false,
                        symbolSize: 6,
                        data: oldAfterGcUsed
                    },
                ];
                legendNameArr = [
                    this.i18n.protalserver_profiling_gc_log.legendName.beforeGC,
                    this.i18n.protalserver_profiling_gc_log.legendName.afterGC,
                ];
                break;
            case 3:
                seriesData = [
                    {
                        name: this.i18n.protalserver_profiling_gc_log.legendName.beforeGC,
                        type: 'line',
                        stack: 'beforeGC',
                        lineStyle: {
                            color: this.lineColorList[0]
                        },
                        connectNulls: true,
                        itemStyle: {
                            normal: {
                                color: this.lineColorList[0]
                            }
                        },
                        showSymbol: false,
                        symbolSize: 6,
                        data: edenBeforeGcUsed
                    },
                    {
                        name: this.i18n.protalserver_profiling_gc_log.legendName.submitHeap,
                        type: 'line',
                        stack: 'submitHeap',
                        connectNulls: true,
                        lineStyle: {
                            color: this.lineColorList[1]
                        },
                        itemStyle: {
                            normal: {
                                color: this.lineColorList[1]
                            }
                        },
                        showSymbol: false,
                        symbolSize: 6,
                        data: edenCommit
                    },
                ];
                legendNameArr = [
                    this.i18n.protalserver_profiling_gc_log.legendName.beforeGC,
                    this.i18n.protalserver_profiling_gc_log.legendName.submitHeap,
                ];
                break;
            case 4:
                seriesData = [
                    {
                        name: this.i18n.protalserver_profiling_gc_log.legendName.beforeGC,
                        type: 'line',
                        stack: 'beforeGC',
                        lineStyle: {
                            color: this.lineColorList[0]
                        },
                        connectNulls: true,
                        itemStyle: {
                            normal: {
                                color: this.lineColorList[0]
                            }
                        },
                        showSymbol: false,
                        symbolSize: 6,
                        data: survivorBeforeGcUsed
                    },
                    {
                        name: this.i18n.protalserver_profiling_gc_log.legendName.afterGC,
                        type: 'line',
                        stack: 'afterGC',
                        connectNulls: true,
                        lineStyle: {
                            color: this.lineColorList[1]
                        },
                        itemStyle: {
                            normal: {
                                color: this.lineColorList[1]
                            }
                        },
                        showSymbol: false,
                        symbolSize: 6,
                        data: survivorAfterGcUsed
                    },
                ];
                legendNameArr = [
                    this.i18n.protalserver_profiling_gc_log.legendName.beforeGC,
                    this.i18n.protalserver_profiling_gc_log.legendName.afterGC,
                ];
                break;
            case 5:
                seriesData = [
                    {
                        name: this.i18n.protalserver_profiling_gc_log.legendName.beforeGC,
                        type: 'line',
                        stack: 'beforeGC',
                        lineStyle: {
                            color: this.lineColorList[0]
                        },
                        connectNulls: true,
                        itemStyle: {
                            normal: {
                                color: this.lineColorList[0]
                            }
                        },
                        showSymbol: false,
                        symbolSize: 6,
                        data: metaspaceBeforeGcUsed
                    },
                    {
                        name: this.i18n.protalserver_profiling_gc_log.legendName.afterGC,
                        type: 'line',
                        stack: 'afterGC',
                        connectNulls: true,
                        lineStyle: {
                            color: this.lineColorList[1]
                        },
                        itemStyle: {
                            normal: {
                                color: this.lineColorList[1]
                            }
                        },
                        showSymbol: false,
                        symbolSize: 6,
                        data: metaspaceAfterGcUsed
                    },
                    {
                        name: this.i18n.protalserver_profiling_gc_log.legendName.submitHeap,
                        type: 'line',
                        stack: 'submitHeap',
                        connectNulls: true,
                        lineStyle: {
                            color: this.lineColorList[3]
                        },
                        itemStyle: {
                            normal: {
                                color: this.lineColorList[3]
                            }
                        },
                        showSymbol: false,
                        symbolSize: 6,
                        data: metaspaceCommit
                    },
                ];
                legendNameArr = [
                    this.i18n.protalserver_profiling_gc_log.legendName.beforeGC,
                    this.i18n.protalserver_profiling_gc_log.legendName.afterGC,
                    this.i18n.protalserver_profiling_gc_log.legendName.submitHeap,
                ];
                break;
            default:
                break;
        }
        const option = {
            title: {
                text: this.memoryUsedType ? this.i18n.protalserver_profiling_gc_log.memorySize :
                    this.i18nService.I18nReplace(this.i18n.protalserver_profiling_gc_log.pauseTime, {
                        0: translate ? 's' : 'ms'
                    }),
                textStyle: {
                    color: this.titleColor,
                    fontSize: 14,
                    fontWeight: 'normal'
                },
                top: '-4',
            },
            tooltip: {
                borderWidth: 0,
                trigger: 'axis',
                axisPointer: {
                    type: 'line',
                    label: {
                        backgroundColor: '#6a7985'
                    }
                },
                backgroundColor: this.toolTipBG,
                borderRadius: 5,
                padding: [8, 20, 8, 20],
                textStyle: {
                    color: this.textColor,
                    fontSize: 12
                },
                extraCssText: 'box-shadow: 0px 4px 8px 0px rgba(0, 0, 0, .2);',
                formatter: (params: any): any => {
                    if (params.length) {
                        let html = ``;
                        if (this.memoryUsedType) {
                            html += `<div><div>${this.i18n.protalserver_profiling_gc_log.systemTime +
                                params[0].axisValueLabel}</div>`;
                        }
                        params.forEach((param: any, index: any) => {
                            if (param.data || param.data === 0) {
                                if (this.memoryUsedType === 0) {
                                    html += `<div><div>${this.i18n.protalserver_profiling_gc_log.systemTime +
                                        param.axisValueLabel}</div>`;
                                }
                                html += `
                                <div style='margin-top:8px;display:flex;justify-content: space-between;
                                 align-items: center;'>
                                    <div style="float:left;">
                                        <div style="display: inline-block;width: 8px;
                                            height: 8px;background-color: ${params[index].color};
                                            margin-right: 8px;"></div>
                                        <div style='display:inline-block;'>
                                        ${this.domSanitizer.sanitize(SecurityContext.HTML, param.seriesName)}</div>
                                    </div>
                                    <div style='margin-left:24px;display:inline-block;'>
                                        ${this.domSanitizer.sanitize(SecurityContext.HTML, this.memoryUsedType === 0
                                    ? param.data + ' ms' : param.data + ' MiB')}
                                    </div>
                                </div>`;
                            }
                        });
                        html += `</div>`;
                        return html;
                    }
                }
            },
            legend: {
                itemHeight: 8,
                itemWidth: 8,
                icon: 'rect',
                data: legendNameArr,
                x: 'right',
                textStyle: {
                    color: this.textColor,
                },
                padding: [
                    5,  // 上
                    5, // 右
                    70,  // 下
                    5, // 左
                ]
            },
            dataZoom: [
                {
                    type: 'inside',
                    realtime: true,
                    showDataShadow: false
                }
            ],
            grid: {
                top: '8%',
                left: '54',
                right: '20',
                bottom: '30'
            },
            xAxis: [
                {
                    type: 'category',
                    data: time,
                    boundaryGap: false,
                    axisTick: {
                        alignWithLabel: true,
                        show: true
                    },
                    axisLabel: {
                        align: 'center',
                        textStyle: {
                            color: this.textColor,
                        }
                    },
                    axisLine: {
                        lineStyle: {
                            color: this.lineColor,
                            width: '1'
                        }
                    },
                    splitLine: {
                        show: false
                    }
                }
            ],
            yAxis: [
                {
                    type: 'value',
                    axisLabel: {
                        formatter: '{value}',
                        textStyle: {
                            color: this.textColor,
                        }
                    },
                    splitLine: {
                        show: true,
                        lineStyle: {
                            type: 'dashed',
                            color: this.lineColor,
                        }
                    },
                    max: maxValue,
                    min: 0,
                    axisLine: {
                        lineStyle: {
                            color: this.lineColor,
                            width: '1'
                        }
                    }
                }
            ],
            series: seriesData
        };
        this.memoryOption = option;
        if (this.echartsInstance) {
            this.echartsInstance.clear();
            this.echartsInstance.setOption(this.memoryOption, true);
        }
        this.sortTime(time);
    }
    /**
     * 将所有元素与遍历到的子数组中的元素合并为一个新数组返回
     */
    public flat(array: Array<any>) {
        const resp: Array<any> = [];
        const expandArray = (res: any, arr: any) => {
            arr.forEach((item: any) => {
                if (Array.isArray(item)) {
                    expandArray(res, item);
                } else {
                    res.push(item);
                }
            });
        };
        expandArray(resp, array);
        return resp;
    }
    /**
     * 优化建议
     */
    public openSuggest() {
        if (this.offlineGcLog) {
            this.allSuggestArr = this.suggestArr;
        } else {
            this.allSuggestArr = this.downloadService.downloadItems.profileInfo.allSuggestArr;
        }
        this.analysis.setTypeTab();
        this.analysis.openSetType();
        this.analysis.show();
    }
    /**
     * close
     */
    public closeHandle() {
        this.isSuggest = false;
    }
    /**
     * IntellIj刷新webview页面
     */
     public updateWebViewPage() {
        if ((self as any).webviewSession.getItem('tuningOperation') === 'hypertuner') {
            this.zone.run(() => {
                this.changeDetectorRef.checkNoChanges();
                this.changeDetectorRef.detectChanges();
            });
        }
    }
}
