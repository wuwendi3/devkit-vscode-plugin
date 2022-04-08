import { Component, OnInit, OnDestroy, Input, AfterViewInit, ChangeDetectorRef,
   Output, EventEmitter, ElementRef, SecurityContext } from '@angular/core';
import { AxiosService } from 'projects/sys/src-web/app/service/axios.service';
import { I18nService } from 'projects/sys/src-web/app/service/i18n.service';
import { LeftShowService } from 'projects/sys/src-web/app/service/left-show.service';
import { fromEvent } from 'rxjs';
import { DomSanitizer } from '@angular/platform-browser';
import * as Util from 'projects/sys/src-web/app/util';
@Component({
  selector: 'app-consum-charts',
  templateUrl: './consum-charts.component.html',
  styleUrls: ['./consum-charts.component.scss']
})
export class ConsumChartsComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() datas: any;
  @Input() timeLine: any;
  @Output() public dataZoom = new EventEmitter<any>();
  @Output() public echartsInstOut = new EventEmitter<any>();
  public i18n: any;
  public timer: any; // 延时器
  public echartsInstance: any;
  public tableData: any;
  public count = 70;
  public baseTop = 47;
  public gridHeight = 55;
  public baseColor = '#e6ebf5';
  public ylabelColor = '#999';
  public titleHeight = 78;  // 组与组之间的距离
  public lineColorList = ['#267DFF', '#07A9EE', '#41BA41', '#E88B00', '#A050E7', '#E72E90'];
  public uuid: any;
  public option: any = {
    title: [],
    legend: {},
    dataZoom: [{
      start: 0,
      end: 100,
      xAxisIndex: [],
      left: '1.3%',
      right: '3.3%',
      height: '18',
      top: 0,
      show: false,
      textStyle: {
        color: 'rgba(0,0,0,0)'
      }
    }, {
      type: 'inside',
    }],
    tooltip: {

    },
    axisPointer: {
      snap: true
    },
    grid: [],
    xAxis: [],
    yAxis: {},
    series: [],
  };
  public language = 'zh';
  public showSwap = false; // 控制dom显隐 防止报错
  public scrollDataIndex = 0;
  public leftSubscribe: any;
  public timelineSubscribe: any;
  constructor(
    public Axios: AxiosService,
    public changeDetectorRef: ChangeDetectorRef,
    public leftShowService: LeftShowService,
    private el: ElementRef,
    public i18nService: I18nService,
    private domSanitizer: DomSanitizer) {
    this.i18n = this.i18nService.I18n();
  }

  ngOnInit() {
    this.leftSubscribe = this.leftShowService.leftIfShow.subscribe((leftState) => {   // 点击左侧echarts需要自适应
      setTimeout(() => {
        const width = $('#user-guide-scroll').width() - 50;
        if (this.echartsInstance) {
          this.echartsInstance.resize({ width });
        }
      }, 400);
    });

    this.timelineSubscribe = this.leftShowService.timelineUPData.subscribe((e) => {
      this.upDateTimeLine(e);
    });

    fromEvent(window, 'resize')
      .subscribe((event) => {
        let timer: any;
        const that = this;
        function debounce() {
          clearTimeout(timer);
          timer = setTimeout(() => {              // 300毫秒的防抖
            const width = $('#user-guide-scroll').width();
            that.echartsInstance.resize({ width });
          }, 300);
        }
        debounce();
      });
    this.uuid = this.Axios.generateConversationId(12);
  }

  ngAfterViewInit() {
    this.setData(this.timeLine);
  }

  /**
   * ngx-echarts初始化后触发事件
   */
  public onChartInit(ec: any) {
    this.echartsInstance = ec;
    this.echartsInstance.on('datazoom', (params: any) => {  // 放大缩小时调用接口
      this.dataZoom.emit({ start: params.batch[0].start, end: params.batch[0].end });
    });

  }

  public upDateTimeLine(data: any) {
    this.option.dataZoom[0].start = (data.start).toFixed(2);
    this.option.dataZoom[0].end = (data.end).toFixed(2);
    this.echartsInstance.setOption({
      dataZoom: this.option.dataZoom
    });
  }

  public makeXAxis(gridIndex: any, opt: any) {
    const option = {
      type: 'category',
      gridIndex,
      boundaryGap: false,
      offset: 0,
      data: this.datas.time,
      show: true,
      axisLine: { onZero: false, lineStyle: { color: this.baseColor, width: 2 } },
      axisTick: { show: true }, // 坐标轴刻度相关设置
      axisLabel: {
        show: true,
        color: this.ylabelColor,                   // 为了symbol 使用这里的间隔策略，所以显示标签但是设置为透明
        interval: 'auto',

      },  // 坐标轴刻度标签的相关设置
      axisPointer: {
        show: true,
        lineStyle: {
          color: '#6C7280',
          width: 1.5
        }
      },
      splitLine: {
        show: false,  // 刻度线
        interval: 0
      },
    };
    if (option) {
      Object.assign(option, opt);
    }
    return option;

  }

  public makeYAxis(gridIndex: any, opt: any) {
    const options = [{
      type: 'value',
      show: true,
      offset: 0,
      nameGap: 30,
      nameRotate: 0,
      nameLocation: 'end',
      nameTextStyle: 'left',
      gridIndex,
      min: 0,
      max: (value: any) => Math.ceil(value.max * 1.5),
      splitNumber: 1,
      axisTick: { show: false },
      axisLine: { show: false }, // y轴是否展示
      axisLabel: {
        show: true, color: '#616161', formatter: (value: any) => {
          if (value !== 0) {
            return Util.fixThouSeparator(value) + 'KB';
          } else {
            return value;
          }
        }
      }, // y轴刻度
      splitLine: {
        show: true,
        interval: 'auto',
        lineStyle: { type: 'dashed' }
      }, // 刻度对应的线
    }];
    if (this.datas.title === this.i18n.diagnostic.consumption.distributor
      || this.datas.title === this.i18n.diagnostic.consumption.apply) {
      const unit = this.datas.title === this.i18n.diagnostic.consumption.distributor
      ? this.i18n.sys_summary.unit.entry : this.i18n.storageIO.ioapis.time1;
      options.push({
        type: 'value',
        show: true,
        gridIndex,
        nameLocation: 'end',
        nameTextStyle: 'left',
        nameGap: 30,
        nameRotate: 0,
        offset: 0,
        min: 0,
        max: (value: any) => Math.ceil(value.max * 1.5),
        splitNumber: 1,
        axisTick: { show: false },
        axisLine: { show: false }, // y轴是否展示
        axisLabel: {
          show: true, color: '#616161', formatter: (value: any) => {
            if (value !== 0) {
              return Util.fixThouSeparator(value) + unit;
            } else {
              return value;
            }
          }
        }, // y轴刻度
        splitLine: {
          show: true,
          interval: 'auto',
          lineStyle: { type: 'dashed' }
        }
      });
    }
    return options;
  }

  public makeGrid(top: any, opt: any) {
    const options = {
      top: 45,
      height: this.gridHeight,
      left: 90,
      right: 80,
    };
    if (opt) {
      Object.assign(options, opt);
    }
    return options;
  }
  public makeTitle(text: any, top: any) {
    const options = {
      text,
      top: 0,
      left: -5,
      textStyle: {
        color: '#222',
        height: 14,
        fontSize: 14,
        lineHeight: 14,
        fontWeight: 'normal',
      }

    };
    return options;
  }

  public makeLegend(data: any) {
    const arr = this.datas.keys.map((item: any) => item.title);
    const option = {
      data: arr,
      type: 'scroll',
      icon: 'rect',
      itemWidth: 8,
      itemHeight: 8,
      top: 0,
      algin: 'left',
      right: 50,
      width: '35%',
      height: 120,
      textStyle: {
        color: '#282b33',
        fontSize: 12,
        lineHeight: 12,
        fontWeight: 'normal',
      },
      show: true,
      selectedMode: true,
      zlevel: 1100,
      inactiveColor: '#ccc'
    };
    return option;
  }

  public setData(timeData: any) {
    this.option.series = [];
    this.option.grid = [];
    this.option.xAxis = [];
    this.option.yAxis = {};              // 情空数据
    this.option.title = [];              // 清空title
    this.option.legend = [];              // 清空图例
    this.option.dataZoom[0].start = timeData.start;
    this.option.dataZoom[0].end = timeData.end;
    this.option.dataZoom[0].xAxisIndex = [0];
    this.option.dataZoom[0].top = 60;

    this.option.xAxis.push(this.makeXAxis(0, {})); //  设置X轴
    this.option.yAxis = this.makeYAxis(0, {}); // 设置Y轴
    this.option.legend = this.makeLegend(this.datas.keys); // 设置图例
    this.option.title.push(this.makeTitle(this.datas.title, 0)); // 设置标题
    this.option.grid.push(this.makeGrid(this.baseTop, {}));
    this.datas.keys.forEach((item: any, index: number) => {
      let colorIdx = 0;
      if (this.lineColorList.length <= index) {
        colorIdx = index % this.lineColorList.length;
      } else {
        colorIdx = index;
      }
      let yAxisIndex = 0;
      if (item.key === 'malloc_count' || item.key === 'free_count'
      || item.key === 'mmap_count' || item.key === 'arena') {
        yAxisIndex = 1;
      }
      this.option.series.push(
        {
          name: item.title,
          id: item.key,
          type: 'line',
          symbol: 'emptyCircle',
          symbolSize: 4,
          showAllSymbol: false,
          xAxisIndex: 0,
          yAxisIndex,
          itemStyle: {

            normal: {
              color: this.lineColorList[colorIdx], // 折线点的颜色
              lineStyle: { color: this.lineColorList[colorIdx] }// 折线的颜色
            }
          },
          data: this.datas.value[item.key]
        }
      );
    });
    this.option.tooltip = {
      trigger: 'axis',
      borderColor: 'rgba(50,50,50,0)',
      backgroundColor: '#fff',
      borderWidth: 1,
      borderRadius: 0,
      enterable: false,
      confine: true,
      padding: [12, 16, 0, 18],
      triggerOn: 'mousemove',
      extraCssText: 'box-shadow: 0 0 3px rgba(0, 0, 0, 0.3);z-index: 1003;',
      axisPointer: {
        show: false,
        type: 'line',
        lineStyle: {
          color: '#6C7280',
          width: 1.5,
        }
      },
      formatter: (params: any): any => {
        if (params.length) {
          let html = ` <div style="max-height:200px;overflow-y:auto;padding-right:5px"> `;
          params.forEach((param: any, index: any) => {
            let unit = 'KB';
            if (param.seriesId === 'malloc_count' || param.seriesId === 'free_count') {
              unit = this.i18n.storageIO.ioapis.time1;
            } else if (param.seriesId === 'mmap_count' || param.seriesId === 'arena') {
              unit = this.i18n.sys_summary.unit.entry;
            } else {
              unit = 'KB';
            }

            if (index === 0) {
              const time = this.datas.yearTime.find((val: string | any[]) => val.includes(param.axisValue));
              html += `<p style="color:#282b33;font-size:12px; line-height: 12px;margin-bottom:12px">
              ${this.domSanitizer.sanitize(SecurityContext.HTML, time || param.axisValue)}</p>`;
            }
            html += `
            <div style="color:#282b33;font-size:12px; line-height: 12px;
            margin-bottom:10px;display:flex;justify-content: space-between;">
              <div style="display:flex;align-items: center;min-width:110px">
                <span style="display:block;margin-right:8px;height:8px;width:8px;background:
                ${this.domSanitizer.sanitize(SecurityContext.HTML, param.color)}"></span>
                <p> ${this.domSanitizer.sanitize(SecurityContext.HTML, param.seriesName.split(',')[0])}:</p>
              </div>
              <p> ${this.domSanitizer.sanitize(SecurityContext.HTML, Util.fixThouSeparator(param.data) + unit)}</p>
            </div>
            `;
          });
          html += `</div>`;
          return html;
        }
      }
    };
    const height = this.gridHeight + this.titleHeight;
    $('#' + this.uuid + ' .table-box').css({ height: height + 'px' });
    setTimeout(() => {
      this.tableData = this.option;
      if (this.echartsInstance) {
        this.echartsInstance.clear();
        this.echartsInstance.setOption(this.tableData, true);
      }
      // echarts图表联动
      setTimeout(() => {
        this.echartsInstOut.emit(this.echartsInstance);
      }, 100);
    }, 100);

  }

  /**
   * 取消订阅
   */
  ngOnDestroy() {
    if (this.leftSubscribe) {
      this.leftSubscribe.unsubscribe();
    }
    if (this.timelineSubscribe) {
      this.timelineSubscribe.unsubscribe();
    }
  }

}
