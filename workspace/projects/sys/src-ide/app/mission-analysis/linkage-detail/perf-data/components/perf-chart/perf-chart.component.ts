import {
  Component, OnInit, Input, AfterViewInit, Output,
  EventEmitter, SecurityContext, ElementRef, OnDestroy
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { LeftShowService } from 'projects/sys/src-ide/app/service/left-show.service';
import { ConfigTableService } from '../../../service/config-table.service';
import { I18nService } from 'projects/sys/src-ide/app/service/i18n.service';
import { fromEvent, Subscription } from 'rxjs';
import { Utils } from '../../../../../service/utils.service';
import { COLOR_THEME, isLightTheme } from '../../../../../service/vscode.service';
import { graphic } from 'echarts';
import { HyTheme, HyThemeService } from 'hyper';

@Component({
  selector: 'app-perf-chart',
  templateUrl: './perf-chart.component.html',
  styleUrls: ['./perf-chart.component.scss']
})
export class PerfChartComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() datas: any;
  @Input() timeLine: any;
  @Output() public dataZoom = new EventEmitter<any>();
  @Output() public echartsInstOut = new EventEmitter<any>();
  // 获取主题颜色
  public currTheme = HyTheme.Dark;
  public i18n: any;
  public echartsInstance: any;
  public tableData: any;
  public intervalCount = 67;
  public baseTop = 18;
  public gridHeight = 80;
  public baseColor = '#e6ebf5';
  public baseLineColor = '#fff';
  public ylabelColor = '#999';
  public lineColorList = ['#3D7FF3', '#298A5F', '#2C8E8B', '#8739DB', '#4E8A30',
    '#A73074', '#A44017', '#A7264D', '#C0691C', '#BAB42B'];
  public twoColorList = ['rgba(38,125,255,0)',
    'rgba(7,169,238,0)', 'rgba(65,186,65,0)', '#E88B00', '#A050E7', '#E72E90'];
  public filter = {};
  public time: any;
  public spec: any;
  public key: any;
  public uuid: any;
  public leftSubscribe: any;
  private themeSub: Subscription;
  public timelineSubscribe: any;
  public scrollDataIndex = 0;
  public option: any = {
    legend: {
      data: [],
      type: 'scroll',
      icon: 'rect',
      top: -1,
      algin: 'left',
      right: 50,
      width: '88%',
      show: true,
      selectedMode: true,
      itemWidth: 8,
      itemHeight: 8,
      pageButtonItemGap: 10,
      textStyle: {
        color: '#282b33',
        fontSize: 12,
        lineHeight: 12,
        fontWeight: 'normal',
      },
    },
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
      type: 'inside'
    }],
    tooltip: {

    },
    axisPointer: {
      link: [{ xAxisIndex: 'all' }],
      snap: true
    },
    grid: [
    ],
    xAxis: [
    ],
    yAxis: [
    ],
    series: [
    ]
  };
  constructor(
    public configTableService: ConfigTableService,
    public leftShowService: LeftShowService,
    public i18nService: I18nService,
    private domSanitizer: DomSanitizer,
    private themeServe: HyThemeService,
    private el: ElementRef) {
    this.i18n = this.i18nService.I18n();
  }

  ngOnInit(): void {
    this.themeSub = this.themeServe.subscribe(msg => {
      this.currTheme = msg;
      this.setData(this.timeLine); // IDE切换主题,web进入页面同样会触发
    });
    if (document.body.className.includes('vscode-dark')) {
      this.currTheme = HyTheme.Dark;
      this.baseColor = '#484a4e';
      this.option.legend.textStyle.color = '#e8e8e8';
    } else {
      this.currTheme = HyTheme.Light;
      this.baseColor = '#e6ebf5';
      this.option.legend.textStyle.color = '#252c3c';
    }
    const that = this;
    this.leftSubscribe = this.leftShowService.leftIfShow.subscribe((leftState) => {   // 点击左侧echarts需要自适应
      setTimeout(() => {
        const width = that.el.nativeElement.querySelector('#' + this.uuid).offsetWidth * 0.92;
        if (this.echartsInstance) {
          this.echartsInstance.resize({ width });
        }
      }, 400);
    });
    this.timelineSubscribe = this.configTableService.timelineUPData.subscribe((e) => {
      this.upDateTimeLine(e);
    });

    fromEvent(window, 'resize')
      .subscribe((event) => {
        let timer: any;
        function debounce() {
          clearTimeout(timer);
          timer = setTimeout(() => {
            // 300毫秒的防抖
            const tableBoxWidth = that.el.nativeElement.querySelector('#' + that.uuid).offsetWidth;
            const width = tableBoxWidth * 0.92;
            that.echartsInstance.resize({ width });
            that.el.nativeElement.querySelector('.title-box').style.width = (tableBoxWidth * 0.08) + 'px';
          }, 300);
        }
        debounce();
      });
    this.uuid = Utils.generateConversationId(12);
  }

  ngAfterViewInit() {
    this.setData(this.timeLine);
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
    this.themeSub?.unsubscribe();
  }

  onChartInit(ec: any) {
    this.echartsInstance = ec;
    this.echartsInstance.on('datazoom', (params: any) => {
      this.dataZoom.emit({ start: params.batch[0].start, end: params.batch[0].end });
    });
    this.echartsInstance.on('legendscroll', (params: any) => {
      this.scrollDataIndex = params.scrollDataIndex;
    });
    this.echartsInstance.on('legendselectchanged', (params: any) => {
      const showLegendList = [];
      for (const key of Object.keys(params.selected)) {
        const isSelected = params.selected[key];
        if (isSelected && key !== this.i18n.sys.averValue) {
          showLegendList.push(key);
        }
      }
      this.rebuildOption(params, showLegendList);
    });
  }
  private rebuildOption(params: any, list: any[]) {
    this.echartsInstance.group = '';
    const lineNum: any = [];
    const option = this.tableData;
    option.legend.selected = params.selected;
    option.legend.scrollDataIndex = this.scrollDataIndex;
    option.series.forEach((series: any) => {
      if (list.indexOf(series.name) >= 0) {
        if (lineNum.indexOf(series.name) === -1) {
          lineNum.push(series.name);
        }
      }
    });

    option.series.forEach((series: any, idx: number) => {
      if (lineNum.length === 1) {
        series.areaStyle = {
          opacity: this.currTheme === HyTheme.Dark ? 0.16 : 1,
          color: new graphic.LinearGradient(0, 0, 0, 1, [{
            offset: 0,
            color: series.itemStyle.normal.color
          }, {
            offset: 1,
            color: series.itemStyle.normal.color
          }])
        };
      } else if (1 < lineNum.length && lineNum.length < 3) {
        series.areaStyle = {
          opacity: this.currTheme === HyTheme.Dark ? 0.16 : 1,
          color: new graphic.LinearGradient(0, 0, 0, 1, [{
            offset: 0,
            color: series.itemStyle.normal.color
          }, {
            offset: 1,
            color: this.currTheme === HyTheme.Dark ? this.twoColorList[idx] : this.baseLineColor
          }])
        };
      } else if (series.areaStyle) {
        delete series.areaStyle;
      }

    });

    setTimeout(() => {
      this.tableData = option;
      this.echartsInstance.clear();
      this.echartsInstance.setOption(option, true);
    }, 100);

    setTimeout(() => {
      // echarts 实例绑定在一块
      this.echartsInstOut.emit(this.echartsInstance);
    }, 100);
  }
  public upDateTimeLine(data: any) {
    this.option.dataZoom[0].start = (data.start).toFixed(2);
    this.option.dataZoom[0].end = (data.end).toFixed(2);
    // 判断时间轴范围内数据是否全为空, 为空不适用渐变函数
    const selectData = (arr: any[]) => {
      const end = Math.floor(arr.length * Number(this.option.dataZoom[0].end) / 100) + 1;
      const start = Math.ceil(arr.length * Number(this.option.dataZoom[0].start) / 100);
      return arr.slice(start, end);
    };
    const noData = this.option.series.some((item: { data: any[]; }) => {
      const allNoData = selectData(item.data).every(val => {
        return val === '-';
      });
      return allNoData;
    });

    this.setData({ start: (data.start).toFixed(2), end: (data.end).toFixed(2) }, noData);
  }

  public makeXAxis(gridIndex: any, opt: any) {

    const option = {
      type: 'category',
      gridIndex,
      boundaryGap: false,
      offset: 0,
      data: this.time,
      axisLine: { onZero: false, lineStyle: { color: this.baseColor, width: 2 } },
      axisTick: { show: false },
      axisLabel: {
        show: false,
        color: this.ylabelColor,
        interval: 'auto'

      },

      splitLine: {
        show: true,
        lineStyle: { color: this.baseColor },
        interval: 'auto'
      },
      axisPointer: {
        lineStyle: { color: 'transparent' }
      }
    };
    if (option) {
      Object.assign(option, opt);
    }
    return option;

  }

  public makeYAxis(gridIndex: any, opt: any) {

    const options = {
      type: 'value',
      show: false,
      gridIndex,
      nameLocation: 'middle',
      nameGap: 30,
      nameRotate: 0,
      offset: 0,
      nameTextStyle: {
        color: '#333'
      },

      min: 0,

      axisTick: { show: false },
      axisLine: { show: false },

      splitLine: { show: true },
      splitNumber: 1
    };
    if (opt) {
      Object.assign(options, opt);
    }
    return options;

  }

  public makeGrid(top: any, opt: any) {
    const options = {
      top: top + 20,
      height: this.gridHeight,
      left: 25,
      right: '2.5%'
    };
    if (opt) {
      Object.assign(options, opt);
    }
    return options;
  }

  public setData(timeData: any, isNoData?: boolean) {
    this.time = this.datas.time;
    this.spec = this.datas.spec;
    this.key = this.datas.key;
    this.option.series = [];
    this.option.grid = [];
    this.option.xAxis = [];
    this.option.yAxis = [];
    this.option.dataZoom[0].start = timeData.start;
    this.option.dataZoom[0].end = timeData.end;
    this.option.dataZoom[0].xAxisIndex = this.key.map((item: any, index: any) => index);
    this.option.dataZoom[0].top = this.key.length * this.gridHeight + this.baseTop + 60;
    this.option.legend.data = this.spec.map((item: any) => item);
    this.option.legend.textStyle.color = this.currTheme === HyTheme.Dark ? '#E8E8E8' : '#282b33';
    const tipItemWidth = 150;

    if (this.spec.length === 0) {
      this.option.legend.show = false;
    }

    this.key.forEach((item: any, index: any) => {
      this.option.grid.push(this.makeGrid(this.baseTop + this.gridHeight * index, {}));

      this.option.yAxis.push(
        this.makeYAxis(index, {
          name: item,
          max: (value: any) => {
            if (value.max.toString() === 'NaN') {
              return 0;
            }
            if (value.max === 0 || value.max === -Infinity) {
              $('#' + this.uuid + ' .table-y ' + `.${item.replace('%', 'x').replace('/', 'x').
                replace('(', 'x').replace(')', 'x')}`).html('1.00');
            } else {
              $('#' + this.uuid + ' .table-y ' + `.${item.replace('%', 'x').replace('/', 'x').replace('(', 'x').
                replace(')', 'x')}`).html(Utils.setThousandSeparator((value.max * 1.5).toFixed(2)));
            }
            return value.max * 1.5;
          }
        }),
      );
      if (index !== this.key.length - 1) {
        this.option.xAxis.push(
          this.makeXAxis(index, {
            axisLabel: {
              show: true,
              // 为了symbol 使用这里的间隔策略，所以显示标签但是设置为透明
              color: 'rgba(0,0,0,0)',
              interval: 'auto'

            },
            axisPointer: {
              show: true,
              lineStyle: {
                color: '#478cf1',
                width: 1.5
              }
            }
          })
        );

      } else {
        this.option.xAxis.push(
          this.makeXAxis(index, {
            axisLabel: {
              show: true,
              color: this.ylabelColor,
              interval: 'auto'

            },
            axisPointer: {
              show: true,
              lineStyle: {
                color: '#478cf1',
                width: 1.5
              }
            }
          })
        );

      }
    });
    this.option.grid.push(this.makeGrid(this.baseTop, {
      show: true,
      height: 0,
      borderColor: this.baseColor,
      borderWidth: 1,
      z: 10,
    }));

    this.option.xAxis.push(
      this.makeXAxis(this.key.length, {
        position: 'top',

        axisPointer: {
          show: true,
          lineStyle: {
            color: '#478cf1',
            width: 1.5
          }
        }
      })
    );

    this.key.forEach((item: any, index: any) => {
      if (this.spec.length > 0) {
        this.spec.forEach((item2: any, index2: any) => {
          let colorIndex = 0;
          if (this.lineColorList.length <= index2) {
            colorIndex = index2 % this.lineColorList.length;
          } else {
            colorIndex = index2;
          }
          const seriesData: any = {
            name: item2,
            type: 'line',
            symbol: 'emptyCircle',
            symbolSize: 4,
            showAllSymbol: false,
            xAxisIndex: index,
            yAxisIndex: index,
            legendHoverLink: false,
            lineStyle: {
            },
            itemStyle: {
              normal: {
                color: this.lineColorList[colorIndex]
              }
            },
            data: this.datas.data[item2][item]
          };
          if (this.spec.length < 3 && !isNoData) {
            seriesData.areaStyle = {
              opacity: this.currTheme === HyTheme.Dark ? 0.16 : 1,
              color: new graphic.LinearGradient(0, 0, 0, 1, [{
                offset: 0,
                color: this.lineColorList[colorIndex]
              }, {
                offset: 1,
                color: this.spec.length === 1 ? this.lineColorList[colorIndex]
                  : this.currTheme === HyTheme.Dark ? this.twoColorList[index2] : this.baseLineColor
              }])
            };
          }
          this.option.series.push(seriesData);
        });
      } else {
        let colorIndex = 0;
        if (this.lineColorList.length < index) {
          colorIndex = Math.floor(index / this.lineColorList.length);
        } else {
          colorIndex = index;
        }
        this.option.series.push(
          {
            name: item,
            type: 'line',
            symbol: 'emptyCircle',
            symbolSize: 4,
            showAllSymbol: false,
            xAxisIndex: index,
            yAxisIndex: index,
            lineStyle: {
            },
            itemStyle: {
              normal: {
                color: this.lineColorList[colorIndex]
              }
            },
            data: this.datas.data[item]
          }
        );
      }
    });

    this.option.yAxis.push(
      this.makeYAxis(this.key.length, {}),
    );
    const xAxisIndexArr: number[] = [];
    this.key.map((item: any, index: number) => {
      xAxisIndexArr.push(index);
    });
    this.option.dataZoom[1].xAxisIndex = xAxisIndexArr;
    const contentBoxHeight = '200px';

    this.option.tooltip = {
      trigger: 'axis',
      borderColor: 'rgba(50,50,50,0)',
      backgroundColor: this.currTheme === HyTheme.Dark ? '#424242' : '#fff',
      borderWidth: 1,
      borderRadius: 0,
      hideDelay: 500,
      enterable: true,
      confine: true,
      padding: [0, 20, 10, 20],
      extraCssText: 'box-shadow: 0 0 3px rgba(0, 0, 0, 0.3);',
      axisPointer: {
        type: 'line',
        lineStyle: {
          color: this.currTheme === HyTheme.Dark ? '#478cf1' : '#6C7280',
          width: 1.5
        }
      },
      textStyle: {
        color: this.currTheme === HyTheme.Dark ? '#aaaaaa' : '#222222',
        fontSize: 12,
      },
      formatter: (params: any): any => {
        if (params.length) {
          const time = params[0].axisValue;
          const table: any = {};
          this.key.forEach((item: any, index: any) => {
            table[item] = [];
            table[item] = params.filter((param: any) => {
              return (param.axisIndex === index);
            });
          });
          let spec = params.map((item: any) => item.seriesName);
          spec = [... new Set(spec)];
          let html = `<div style="max-height:${contentBoxHeight};overflow-Y:auto;display:flex;" class='chart-tip'>`;
          if (this.spec.length >= 1) {
            html += `<div class="left-box"
            style="max-width: 260px; overflow-x: auto;display:flex; flex-direction: column;">`;
            html += `<span class="first-span" style="color:${this.currTheme === HyTheme.Dark ? '#AAAAAA' :
              '#282b33'};text-align:left;width:${tipItemWidth + 110}px;
              display:inline-block;margin-top:7px">${time}</span>`;
            spec.forEach((item: any, index: any) => {
              let colorIndex = 0;
              if (this.lineColorList.length <= index) {
                colorIndex = index % this.lineColorList.length;
              } else {
                colorIndex = index;
              }
              const colName = item;
              html += `<span style="color:${this.currTheme === HyTheme.Dark ?
                '#E8E8E8' : '#282b33'};width:${tipItemWidth + 110}px;display:inline-block;margin-top:7px;">
                          <div style="display:inline-block;position:relative;top:1px;margin-right:5px;
                          width:8px;height:8px;background:${this.lineColorList[colorIndex]}"></div>
                          ${this.domSanitizer.sanitize(SecurityContext.HTML, colName)}
                        </span>`;
            });
            html += `</div><div class="right-box" style="padding-left: 20px;">`;
            if (table != null) {
              Object.keys(table).forEach(a => {
                const itemName = a;
                html += `
                    <span style="color:${this.currTheme === HyTheme.Dark ? '#E8E8E8' :
                    '#282b33'};width:${tipItemWidth - 50}px;text-align:left;display:inline-block;margin-top:7px;">
                      ${this.domSanitizer.sanitize(SecurityContext.HTML, itemName)}
                    </span> `;
              });
            }
            spec.forEach((item: any, index: any) => {
              html += `<div>`;
              if (table != null) {
                Object.keys(table).forEach(a => {
                  let value;
                  if (table[a][index].value !== 'NULL' && table[a][index].value !== null) {
                    value = Utils.setThousandSeparator(table[a][index].value);
                  } else {
                    value = '--';
                  }
                  html += `
                    <span style="color:${this.currTheme === HyTheme.Dark ? '#E8E8E8' :
                      '#282b33'};width:${tipItemWidth - 50}px;display:inline-block;margin-top:7px;z-index:-1">
                      ${this.domSanitizer.sanitize(SecurityContext.HTML, value)}
                    </span>
                  `;
                });
              }
              html += `</div>`;
            });
            html += `</div>`;
          } else {
            html += `<span style="color:#282b33;text-align:right;width:${tipItemWidth + 20}px;
            display:inline-block;margin-top:7px;">
                  ${this.domSanitizer.sanitize(SecurityContext.HTML, this.datas.title)}
                </span>`;
          }

          html += '</div>';
          // 修改鼠标经过tips框离开触发区域,tips不消失的问题
          const tipBoxContent = $('#' + this.uuid + ' .echart-content');
          const tipBox = $('#' + this.uuid + ' .chart-tip').parent();
          if (tipBox) {
            tipBoxContent[0].onmouseleave = (e) => {
              tipBox.css('display', 'none');
            };
          }
          return html;
        }
      },
      position(point: any, params: any, dom: any, rect: any, size: any): any {
        // 解决tooltip legend位置不正确的问题
        if (!Array.isArray(params) && params.componentType === 'legend') {
          const top = point[1] + 20;
          let right = size.viewSize[0] - (point[0] + size.contentSize[0] / 2);

          if (right < 0) {
            right = 0;
          }

          // 解决设置最大宽度且文字自动换行时，echarts计算宽度错误的问题【不足400px就开始换行】
          if (size.contentSize[0] >= 440) {
            dom.style.width = '400px';
            dom.style.whiteSpace = 'normal';
          }

          return { top, right };
        }
      },
    };
    const height = this.key.length * this.gridHeight + this.baseTop * 2 + 25;
    $('#' + this.uuid + ' .table-box').css({ height: height + 'px' });
    this.setLeft();
    setTimeout(() => {
      this.tableData = this.option;
      if (this.echartsInstance) {
        this.echartsInstance.clear();
        this.echartsInstance.setOption(this.tableData, true);
      }
      setTimeout(() => {
        this.echartsInstOut.emit(this.echartsInstance);
      }, 100);
    }, 100);
  }
  public setLeft() {
    let html = ``;
    this.key.forEach((item: any, index: any) => {
      const itemName = item;
      if (index === 0) {
        html += `<div class="line"
         style="margin-top: ${this.domSanitizer.sanitize(SecurityContext.HTML, this.baseTop + 20 - 1)}px;
        background:${this.domSanitizer.sanitize(SecurityContext.HTML, this.baseColor)}"></div>
        <div class="title-box"
         style="height: ${this.domSanitizer.sanitize(SecurityContext.HTML, this.gridHeight - 2 * 2)}px;
        color:${this.domSanitizer.sanitize(SecurityContext.HTML, this.ylabelColor)}">
            <span class="title-num  ${this.domSanitizer.sanitize(SecurityContext.HTML, item.replace('%', 'x')
          .replace('/', 'x').replace('(', 'x').replace(')', 'x'))}"></span>
            <span class="title" style='color:${this.currTheme === HyTheme.Dark ? '#e8e8e8' : '#6C7280'};
            font-size: 14px;'>${this.domSanitizer.sanitize(SecurityContext.HTML, itemName)}</span>
            <span class="title-num">0</span>
        </div>
        <div class="line" style="margin-top: 2px;
        background:${this.domSanitizer.sanitize(SecurityContext.HTML, this.baseColor)}"></div>`;
      } else {
        html += `
        <div class="title-box"
         style="height: ${this.domSanitizer.sanitize(SecurityContext.HTML, this.gridHeight - 2 * 2)}px;
        color:${this.domSanitizer.sanitize(SecurityContext.HTML, this.ylabelColor)}">
            <span class="title-num
            ${this.domSanitizer.sanitize(SecurityContext.HTML, item.replace('%', 'x').replace('/', 'x').
          replace('(', 'x').replace(')', 'x'))}"></span>
            <span class="title" style='color:${this.currTheme === HyTheme.Dark ? '#e8e8e8' : '#6C7280'};
            font-size: 14px;'>${this.domSanitizer.sanitize(SecurityContext.HTML, itemName)}</span>
            <span class="title-num">0</span>
        </div>
        <div class="line"
        style="margin-top: 2px;background:${this.domSanitizer.sanitize(SecurityContext.HTML, this.baseColor)}"></div>`;
      }
    });
    $('#' + this.uuid + ' .table-y').html(html);
  }

}
