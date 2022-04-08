import { IStaticIcon } from '../../domain';
const hardUrl: any = require('../../../../assets/hard-coding/url.json');
/** 创建任务-c++性能分析 */
export const hpcAnalysisHover: IStaticIcon = {
    name: 'hpcAnalysisHover',
    data: `
  <?xml version="1.0" encoding="UTF-8"?>
  <svg viewBox="0 0 64 64" version="1.1" xmlns="${hardUrl.w3cUrl}" xmlns:xlink="${hardUrl.xlinkUrl}">
      <defs>
          <path d="M3.07820498,0.00290592749 L3.19345802,0.018891447 L43.193458,
          7.90621539 C43.6230773,7.99092906 43.9427805,
          8.3433373 43.9930809,8.7694344 L44,8.88732394 L44,35.5 C44,35.9612123 43.6857628,
          36.3570916 43.248096,36.4687989 L43.1362183,
          36.4906788 L3.13621834,41.9906788 C2.57298538,42.0681234 2.06718482,
          41.6626447 2.00615988,41.1119707 L2,41 L2.00008893,
          30.3293257 C0.834850101,29.9175144 0,28.8062521 0,27.5 C0,25.8431458 1.34314575,
          24.5 3,24.5 C4.65685425,24.5 6,25.8431458 6,
          27.5 C6,28.8058822 5.16562257,29.9168852 4.00090072,30.3289758 L4,
          39.853 L12,38.7526684 L12,3.79266837 L4,2.216 L4.00090072,
          10.6710242 C5.16562257,11.0831148 6,12.1941178 6,13.5 C6,15.1568542 4.65685425,
          16.5 3,16.5 C1.34314575,16.5 0,15.1568542 0,
          13.5 C0,12.1937479 0.834850101,11.0824856 2.00008893,10.6706743 L2,1 C2,
          0.409430227 2.50573798,-0.0432334685 3.07820498,
          0.00290592749 Z M13,3.99066837 L13,38.6156684 L42,34.628 L42,9.709 L13,
          3.99066837 Z M22,22.9085666 C22.5522847,22.8957254 23,
          23.3570579 23,23.9389815 L23,31.3146429 C23,31.8965665 22.5522847,
          32.4161941 22,32.4752636 L18,32.9030829 C17.4477153,
          32.9621524 17,32.5133118 17,31.9005693 L17,24.1342903 C17,23.5215478 17.4477153,
          23.014412 18,23.0015708 L22,22.9085666 Z M30,
          23.0778776 C30.5522847,23.0654916 31,23.4783399 31,24 L31,30.6716633 C31,
          31.1933234 30.5522847,31.6624004 30,31.719376 L26,
          32.1320297 C25.4477153,32.1890053 25,31.788206 25,31.2368195 L25,
          24.1883854 C25,23.6369989 25.4477153,23.1799709 26,
          23.1675849 L30,23.0778776 Z M22.0077525,23.9093173 L18.0232448,
          24.0013006 C18.0340866,24.0010485 18.0155905,24.0250066 18.0056648,
          24.0752324 L18,24.1342903 L18,31.897 L21.8936517,31.4809347 C21.9215457,
          31.4779513 21.9728722,31.4242589 21.9922871,
          31.3621458 L22,31.3146429 L22,23.9389815 C22,23.9175177 22.0008652,
          23.9112546 22.0077525,23.9093173 Z M37.1666667,
          23.3668768 C37.626904,23.3550164 38,23.7195775 38,24.1811467 L38,
          30.0313619 C38,30.4929311 37.626904,30.9113346 37.1666667,
          30.9658924 L33.8333333,31.3610343 C33.373096,31.415592 33,31.0625686 33,
          30.5725345 L33,24.3615376 C33,23.8715035 33.373096,
          23.4646376 33.8333333,23.4527772 L37.1666667,23.3668768 Z M30,
          24.077 L26.0224212,24.1673335 L26.0077303,24.1751513 L26,
          24.1883854 L26,31.126 L29.8973812,30.7246552 C29.9244283,30.7218649 29.950083,
          30.7077599 29.9689759,30.6947809 L30,
          30.6716633 L30,24.077 Z M37,24.371 L34,24.448 L34,30.333 L37,29.978 L37,
          24.371 Z M18,10.0969171 L22,10.5247364 C22.5522847,
          10.5838059 23,11.1034335 23,11.6853571 L23,19.0610185 C23,19.6429421 22.5522847,20.1042746 22,20.0914334 L18,
          19.9984292 C17.4477153,19.985588 17,19.4784522 17,18.8657097 L17,
          11.0994307 C17,10.4866882 17.4477153,10.0378476 18,
          10.0969171 Z M26,11.0053949 L30,11.4180487 C30.5522847,11.4750243 31,
          11.9441012 31,12.4657613 L31,19.0778776 C31,
          19.5995377 30.5522847,20.012386 30,20 L26,19.9102927 C25.4477153,19.8979067 25,19.4408787 25,18.8894922 L25,
          11.9006051 C25,11.3492186 25.4477153,10.9484193 26,11.0053949 Z M33.6666667,12.1048581 L37,12.5 C37.4602373,
          12.5545577 37.8333333,12.9729613 37.8333333,13.4345305 L37.8333333,
          19.1857301 C37.8333333,19.6472993 37.4602373,
          20.0118604 37,20 L33.6666667,19.9140996 C33.2064294,19.9022392 32.8333333,
          19.4953733 32.8333333,19.0053392 L32.8333333,
          12.8933579 C32.8333333,12.4033237 33.2064294,12.0503004 33.6666667,12.1048581 Z M18,11.102 L18,18.8657097 C18,
          18.9336759 18.0212066,18.9746886 18.0257113,18.9908052 L18.0232448,
          18.9986994 L22.0232448,19.0917036 C22.009046,
          19.0913734 22.0034479,19.0921549 22.0012935,19.0831731 L22,
          11.6853571 C22,11.6216767 21.9542523,11.5558449 21.9181011,
          11.53015 L21.8936517,11.5190653 L18,11.102 Z M26,12.011 L26,
          18.8894922 L26.0077303,18.9027263 L26.0224212,18.9105441 L30,
          19 L30,12.4657613 L29.9689759,12.4426438 C29.9595295,12.4361543 29.9483926,
          12.4293833 29.9362364,12.4238858 L29.8973812,
          12.4127694 L26,12.011 Z M33.833,13.131 L33.833,18.918 L36.833,
          18.995 L36.833,13.487 L33.833,13.131 Z" id="path-1"></path>
      </defs>
      <g id="4.组件/2.通用/icon/Bigicon/HPC/Click" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
          <g id="3.颜色/10.辅助说明文本" transform="translate(11.000000, 11.000000)">
              <mask id="mask-2" fill="white">
                  <use xlink:href="#path-1"></use>
              </mask>
              <use id="蒙版" fill="#979797" fill-rule="nonzero" xlink:href="#path-1"></use>
              <g id="编组" mask="url(#mask-2)">
                  <g transform="translate(-11.000000, -11.000000)" id="3.颜色/10.辅助说明文本">
                      <rect id="矩形" fill="#0067FF" x="0" y="0" width="64" height="64"></rect>
                  </g>
              </g>
          </g>
      </g>
  </svg>
  `
};

export const hpcAnalysisNormal: IStaticIcon = {
    name: 'hpcAnalysisNormal',
    data: `
  <?xml version="1.0" encoding="UTF-8"?>
  <svg  viewBox="0 0 64 64" version="1.1" xmlns="${hardUrl.w3cUrl}" xmlns:xlink="${hardUrl.xlinkUrl}">
      <defs>
          <path d="M3.07820498,0.00290592749 L3.19345802,0.018891447 L43.193458,
          7.90621539 C43.6230773,7.99092906 43.9427805,
          8.3433373 43.9930809,8.7694344 L44,8.88732394 L44,35.5 C44,
          35.9612123 43.6857628,36.3570916 43.248096,36.4687989 L43.1362183,
          36.4906788 L3.13621834,41.9906788 C2.57298538,42.0681234 2.06718482,
          41.6626447 2.00615988,41.1119707 L2,41 L2.00008893,
          30.3293257 C0.834850101,29.9175144 0,28.8062521 0,27.5 C0,
          25.8431458 1.34314575,24.5 3,24.5 C4.65685425,24.5 6,25.8431458 6,
          27.5 C6,28.8058822 5.16562257,29.9168852 4.00090072,30.3289758 L4,
          39.853 L12,38.7526684 L12,3.79266837 L4,2.216 L4.00090072,
          10.6710242 C5.16562257,11.0831148 6,12.1941178 6,13.5 C6,
          15.1568542 4.65685425,16.5 3,16.5 C1.34314575,16.5 0,15.1568542 0,
          13.5 C0,12.1937479 0.834850101,11.0824856 2.00008893,10.6706743 L2,
          1 C2,0.409430227 2.50573798,-0.0432334685 3.07820498,
          0.00290592749 Z M13,3.99066837 L13,38.6156684 L42,34.628 L42,
          9.709 L13,3.99066837 Z M22,22.9085666 C22.5522847,22.8957254 23,
          23.3570579 23,23.9389815 L23,31.3146429 C23,31.8965665 22.5522847,
          32.4161941 22,32.4752636 L18,32.9030829 C17.4477153,
          32.9621524 17,32.5133118 17,31.9005693 L17,24.1342903 C17,
          23.5215478 17.4477153,23.014412 18,23.0015708 L22,22.9085666 Z M30,
          23.0778776 C30.5522847,23.0654916 31,23.4783399 31,24 L31,
          30.6716633 C31,31.1933234 30.5522847,31.6624004 30,31.719376 L26,
          32.1320297 C25.4477153,32.1890053 25,31.788206 25,31.2368195 L25,
          24.1883854 C25,23.6369989 25.4477153,23.1799709 26,
          23.1675849 L30,23.0778776 Z M22.0077525,23.9093173 L18.0232448,24.0013006 C18.0340866,24.0010485 18.0155905,
          24.0250066 18.0056648,24.0752324 L18,24.1342903 L18,31.897 L21.8936517,
          31.4809347 C21.9215457,31.4779513 21.9728722,
          31.4242589 21.9922871,31.3621458 L22,31.3146429 L22,23.9389815 C22,
          23.9175177 22.0008652,23.9112546 22.0077525,
          23.9093173 Z M37.1666667,23.3668768 C37.626904,23.3550164 38,23.7195775 38,24.1811467 L38,30.0313619 C38,
          30.4929311 37.626904,30.9113346 37.1666667,30.9658924 L33.8333333,
          31.3610343 C33.373096,31.415592 33,31.0625686 33,
          30.5725345 L33,24.3615376 C33,23.8715035 33.373096,23.4646376 33.8333333,
          23.4527772 L37.1666667,23.3668768 Z M30,
          24.077 L26.0224212,24.1673335 L26.0077303,24.1751513 L26,
          24.1883854 L26,31.126 L29.8973812,30.7246552 C29.9244283,
          30.7218649 29.950083,30.7077599 29.9689759,30.6947809 L30,30.6716633 L30,
          24.077 Z M37,24.371 L34,24.448 L34,30.333 L37,
          29.978 L37,24.371 Z M18,10.0969171 L22,10.5247364 C22.5522847,
          10.5838059 23,11.1034335 23,11.6853571 L23,19.0610185 C23,
          19.6429421 22.5522847,20.1042746 22,20.0914334 L18,19.9984292 C17.4477153,
          19.985588 17,19.4784522 17,18.8657097 L17,
          11.0994307 C17,10.4866882 17.4477153,10.0378476 18,10.0969171 Z M26,
          11.0053949 L30,11.4180487 C30.5522847,11.4750243 31,
          11.9441012 31,12.4657613 L31,19.0778776 C31,19.5995377 30.5522847,
          20.012386 30,20 L26,19.9102927 C25.4477153,19.8979067 25,
          19.4408787 25,18.8894922 L25,11.9006051 C25,11.3492186 25.4477153,
          10.9484193 26,11.0053949 Z M33.6666667,12.1048581 L37,
          12.5 C37.4602373,12.5545577 37.8333333,12.9729613 37.8333333,
          13.4345305 L37.8333333,19.1857301 C37.8333333,19.6472993 37.4602373,
          20.0118604 37,20 L33.6666667,19.9140996 C33.2064294,19.9022392 32.8333333,
          19.4953733 32.8333333,19.0053392 L32.8333333,
          12.8933579 C32.8333333,12.4033237 33.2064294,12.0503004 33.6666667,12.1048581 Z M18,11.102 L18,18.8657097 C18,
          18.9336759 18.0212066,18.9746886 18.0257113,18.9908052 L18.0232448,
          18.9986994 L22.0232448,19.0917036 C22.009046,
          19.0913734 22.0034479,19.0921549 22.0012935,19.0831731 L22,
          11.6853571 C22,11.6216767 21.9542523,11.5558449 21.9181011,
          11.53015 L21.8936517,11.5190653 L18,11.102 Z M26,12.011 L26,
          18.8894922 L26.0077303,18.9027263 L26.0224212,18.9105441 L30,
          19 L30,12.4657613 L29.9689759,12.4426438 C29.9595295,12.4361543 29.9483926,
          12.4293833 29.9362364,12.4238858 L29.8973812,
          12.4127694 L26,12.011 Z M33.833,13.131 L33.833,18.918 L36.833,
          18.995 L36.833,13.487 L33.833,13.131 Z" id="path-1"></path>
      </defs>
      <g id="4.组件/2.通用/icon/Bigicon/HPC/Normal" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
          <g id="3.颜色/10.辅助说明文本" transform="translate(11.000000, 11.000000)">
              <mask id="mask-2" fill="white">
                  <use xlink:href="#path-1"></use>
              </mask>
              <use id="蒙版" fill="#979797" fill-rule="nonzero" xlink:href="#path-1"></use>
              <g id="编组" mask="url(#mask-2)">
                  <g transform="translate(-11.000000, -11.000000)" id="3.颜色/10.辅助说明文本">
                      <rect id="矩形备份-6" fill="#979797" x="0" y="0" width="64" height="64"></rect>
                  </g>
              </g>
          </g>
      </g>
  </svg>
  `
};

export const hpcAnalysisDisabled: IStaticIcon = {
    name: 'hpcAnalysisDisabled',
    data: `
  <?xml version="1.0" encoding="UTF-8"?>
  <svg viewBox="0 0 64 64" version="1.1" xmlns="${hardUrl.w3cUrl}" xmlns:xlink="${hardUrl.xlinkUrl}">
      <defs>
          <path d="M3.07820498,0.00290592749 L3.19345802,0.018891447 L43.193458,
          7.90621539 C43.6230773,7.99092906 43.9427805,
          8.3433373 43.9930809,8.7694344 L44,8.88732394 L44,35.5 C44,
          35.9612123 43.6857628,36.3570916 43.248096,36.4687989 L43.1362183,
          36.4906788 L3.13621834,41.9906788 C2.57298538,42.0681234 2.06718482,
          41.6626447 2.00615988,41.1119707 L2,41 L2.00008893,
          30.3293257 C0.834850101,29.9175144 0,28.8062521 0,27.5 C0,25.8431458 1.34314575,
          24.5 3,24.5 C4.65685425,24.5 6,25.8431458 6,
          27.5 C6,28.8058822 5.16562257,29.9168852 4.00090072,30.3289758 L4,
          39.853 L12,38.7526684 L12,3.79266837 L4,2.216 L4.00090072,
          10.6710242 C5.16562257,11.0831148 6,12.1941178 6,13.5 C6,15.1568542 4.65685425,
          16.5 3,16.5 C1.34314575,16.5 0,15.1568542 0,
          13.5 C0,12.1937479 0.834850101,11.0824856 2.00008893,10.6706743 L2,1 C2,
          0.409430227 2.50573798,-0.0432334685 3.07820498,
          0.00290592749 Z M13,3.99066837 L13,38.6156684 L42,34.628 L42,9.709 L13,
          3.99066837 Z M22,22.9085666 C22.5522847,
          22.8957254 23,23.3570579 23,23.9389815 L23,31.3146429 C23,31.8965665 22.5522847,32.4161941 22,32.4752636 L18,
          32.9030829 C17.4477153,32.9621524 17,32.5133118 17,31.9005693 L17,
          24.1342903 C17,23.5215478 17.4477153,23.014412 18,
          23.0015708 L22,22.9085666 Z M30,23.0778776 C30.5522847,23.0654916 31,23.4783399 31,24 L31,30.6716633 C31,
          31.1933234 30.5522847,31.6624004 30,31.719376 L26,32.1320297 C25.4477153,
          32.1890053 25,31.788206 25,31.2368195 L25,
          24.1883854 C25,23.6369989 25.4477153,23.1799709 26,23.1675849 L30,
          23.0778776 Z M22.0077525,23.9093173 L18.0232448,
          24.0013006 C18.0340866,24.0010485 18.0155905,24.0250066 18.0056648,
          24.0752324 L18,24.1342903 L18,31.897 L21.8936517,
          31.4809347 C21.9215457,31.4779513 21.9728722,31.4242589 21.9922871,
          31.3621458 L22,31.3146429 L22,23.9389815 C22,
          23.9175177 22.0008652,23.9112546 22.0077525,23.9093173 Z M37.1666667,
          23.3668768 C37.626904,23.3550164 38,23.7195775 38,
          24.1811467 L38,30.0313619 C38,30.4929311 37.626904,30.9113346 37.1666667,
          30.9658924 L33.8333333,31.3610343 C33.373096,
          31.415592 33,31.0625686 33,30.5725345 L33,24.3615376 C33,23.8715035 33.373096,
          23.4646376 33.8333333,23.4527772 L37.1666667,
          23.3668768 Z M30,24.077 L26.0224212,24.1673335 L26.0077303,24.1751513 L26,24.1883854 L26,31.126 L29.8973812,
          30.7246552 C29.9244283,30.7218649 29.950083,30.7077599 29.9689759,30.6947809 L30,30.6716633 L30,24.077 Z M37,
          24.371 L34,24.448 L34,30.333 L37,29.978 L37,24.371 Z M18,10.0969171 L22,10.5247364 C22.5522847,10.5838059 23,
          11.1034335 23,11.6853571 L23,19.0610185 C23,19.6429421 22.5522847,
          20.1042746 22,20.0914334 L18,19.9984292 C17.4477153,
          19.985588 17,19.4784522 17,18.8657097 L17,11.0994307 C17,10.4866882 17.4477153,10.0378476 18,10.0969171 Z M26,
          11.0053949 L30,11.4180487 C30.5522847,11.4750243 31,11.9441012 31,
          12.4657613 L31,19.0778776 C31,19.5995377 30.5522847,
          20.012386 30,20 L26,19.9102927 C25.4477153,19.8979067 25,19.4408787 25,
          18.8894922 L25,11.9006051 C25,11.3492186 25.4477153,
          10.9484193 26,11.0053949 Z M33.6666667,12.1048581 L37,12.5 C37.4602373,
          12.5545577 37.8333333,12.9729613 37.8333333,
          13.4345305 L37.8333333,19.1857301 C37.8333333,19.6472993 37.4602373,
          20.0118604 37,20 L33.6666667,19.9140996 C33.2064294,
          19.9022392 32.8333333,19.4953733 32.8333333,19.0053392 L32.8333333,
          12.8933579 C32.8333333,12.4033237 33.2064294,
          12.0503004 33.6666667,12.1048581 Z M18,11.102 L18,18.8657097 C18,18.9336759 18.0212066,18.9746886 18.0257113,
          18.9908052 L18.0232448,18.9986994 L22.0232448,19.0917036 C22.009046,
          19.0913734 22.0034479,19.0921549 22.0012935,
          19.0831731 L22,11.6853571 C22,11.6216767 21.9542523,11.5558449 21.9181011,11.53015 L21.8936517,11.5190653 L18,
          11.102 Z M26,12.011 L26,18.8894922 L26.0077303,18.9027263 L26.0224212,
          18.9105441 L30,19 L30,12.4657613 L29.9689759,
          12.4426438 C29.9595295,12.4361543 29.9483926,12.4293833 29.9362364,
          12.4238858 L29.8973812,12.4127694 L26,12.011 Z M33.833,
          13.131 L33.833,18.918 L36.833,18.995 L36.833,13.487 L33.833,13.131 Z" id="path-1"></path>
      </defs>
      <g id="4.组件/2.通用/icon/Bigicon/HPC/Disabled" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
          <g id="3.颜色/10.辅助说明文本" transform="translate(11.000000, 11.000000)">
              <mask id="mask-2" fill="white">
                  <use xlink:href="#path-1"></use>
              </mask>
              <use id="蒙版" fill="#979797" fill-rule="nonzero" xlink:href="#path-1"></use>
              <g id="编组" mask="url(#mask-2)">
                  <g transform="translate(-11.000000, -11.000000)" id="3.颜色/10.辅助说明文本">
                      <rect id="矩形备份-6" fill="#CCCCCC" x="0" y="0" width="64" height="64"></rect>
                  </g>
              </g>
          </g>
      </g>
    </g>
  </svg>
  `
};
