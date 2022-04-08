/*
 * Copyright 2022 Huawei Technologies Co., Ltd
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Injectable } from '@angular/core';
import { AxiosService } from '../../service';

@Injectable({
  providedIn: 'root'
})

export class SourceCodeReportApi {
  constructor(private axiosServe: AxiosService) {}

  // 获取源码迁移报告详情
  public getReport(reportId: string) {
    return this.axiosServe.axios({
      url: '/task/progress/',
      method: 'get',
      params: {
        task_type: 0,
        task_id: reportId
      }
    });
  }

  // 下载源码迁移 HTML 报告
  public downloadHTML(reportId: string) {
    return this.axiosServe.axios({
      url: `/portadv/tasks/${encodeURIComponent(reportId)}/download/`,
      method: 'get',
      params: {
        report_type: 1
      }
    });
  }

  // 获取增强功能 内存一致性源码报告
  public getEnhancementsSourceReport(reportId: string) {
    return this.axiosServe.axios({
      url: '/task/progress/',
      method: 'get',
      params: {
        task_type: 10,
        task_id: reportId
      }
    });
  }
}
