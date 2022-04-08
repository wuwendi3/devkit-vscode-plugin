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
import { AnalysePackage } from './modules/porting-workload.interface';

@Injectable({
  providedIn: 'root'
})

export class PortingWorkloadApi {
  constructor(private axiosServe: AxiosService) {}

  // 分析软件包
  public analysePackage(data: AnalysePackage): Promise<object> {
    return this.axiosServe.axios({
      url: '/portadv/binary/',
      method: 'post',
      data
    });
  }
}
