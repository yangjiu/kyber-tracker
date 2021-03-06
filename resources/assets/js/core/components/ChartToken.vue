<template>
  <div>
    <canvas :id="elementId" height="250px" class="mt-20"></canvas>
  </div>
</template>

<script>

  import _ from 'lodash';
  import moment from 'moment';
  import BigNumber from 'bignumber.js';
  import AppRequest from '../request/AppRequest';
  import util from '../helper/util';
  import network from '../../../../../config/network';

  export default {
    props: {
      elementId: {
        type: String,
      },
    },
    data() {
      return {
        chartInstance: undefined
      };
    },
    methods: {
      _buildChartData(ret) {
        ret = ret.slice(0, 5);
        const labels = [];
        const dataset = [];
        const volumeTokens = [];
        const volumeEths = [];

        for (let i = 0; i < ret.length; i++) {
          labels.push(ret[i].symbol);
          dataset.push(Math.round(ret[i].volumeUSD * 100) / 100);
          volumeTokens.push(Math.round(ret[i].volumeTokenNumber * 1000) / 1000);
          volumeEths.push(Math.round(ret[i].volumeEthNumber * 1000) / 1000);
        }

        return {
          labels,
          volumeTokens,
          volumeEths,
          datasets: [{
            data: dataset,
            pointRadius: 0,
            backgroundColor: [
              '#3ABD86', '#3ABD86', '#3ABD86', '#3ABD86', '#3ABD86'
            ],
            showLine: true,
            spanGaps: true,
          }]
        };
      },
      _getChartOptions() {
        const callbacks = {
          title: (tooltipItem, data) => {
            const index = tooltipItem[0].index;
            const symbol = data.labels[index];
            const tokenName = util.getTokenInfo(symbol).name;
            return tokenName + " - " + symbol;
          },
          label: () => {
          },
          afterBody: (tooltipItem, data) => {
            const index = tooltipItem[0].index;
            const tokenSymbol = data.labels[index];
            const usdText = this.$t('chart.title.label_volume') + ' (USD): $' + util.numberWithCommas(data.datasets[0].data[index]);
            const ethText = this.$t('chart.title.label_volume') + ' (ETH): ' + util.numberWithCommas(data.volumeEths[index]);
            const tokenText = this.$t('chart.title.label_volume') + ' (' +
              tokenSymbol + '): ' + util.numberWithCommas(data.volumeTokens[index]);
            
            if (tokenSymbol === "ETH") {
              return [usdText, tokenText];
            } else {
              return [usdText, ethText, tokenText];
            }
          }
        };

        const yAxeScale = {
          ticks: {
            fontFamily: "Montserrat, My-Montserrat, sans-serif",
            fontSize: 12
          },
          gridLines: {
              drawBorder: false
          }
        };

        const xAxeScale = {
          ticks: {
            beginAtZero: true,
            fontFamily: "Montserrat, My-Montserrat, sans-serif",
            fontSize: 12,
            callback: (label, index, labels) => {
              if (index === 0) {
                return " ";
              }
              return '$' + util.numberWithCommas(label / 1000) + "k";
            }
          }
        };

        return {
          tooltips: {
            mode: 'index',
            axis: 'y',
            intersect: false,
            fontFamily: "Montserrat, My-Montserrat, sans-serif",
            backgroundColor: 'rgba(25, 46, 59, 0.8)',
            titleFontSize: 14,
            titleFontColor: "#f8f8f8",
            bodyFontSize: 14,
            bodyFontColor: "#f8f8f8",
            bodySpacing: 6,
            titleMarginBottom: 15,
            xPadding: 12,
            yPadding: 12,
            callbacks,
          },
          scales: {
            xAxes: [xAxeScale],
            yAxes: [yAxeScale],
          },
          legend: {
            display: false
          },
          maintainAspectRatio: false
        };
      },
      refresh(period) {
        const now = Date.now() / 1000 | 0;
        let start;
        switch (period) {
          case 'H24':
            start = now - 60 * 60 * 24;
            break;
          case 'D7':
            start = now - 60 * 60 * 24 * 7;
            break;
          case 'D30':
            start = now - 60 * 60 * 24 * 30;
            break;
          case 'Y1':
            start = now - 60 * 60 * 24 * 365;
            break;
          default:
            start = now - 60 * 60 * 24 * 365 * 10;
            break;
        }
        AppRequest.getTopToken(start, now, (err, ret) => {
          const ctx = document.getElementById(this.elementId);

          // Ignore render chart if the page has been changed and the chart element is omitted
          if (!ctx) {
            return;
          }
          
          const data = this._buildChartData(ret);
          const options = this._getChartOptions();

          if (this.chartInstance) {
            this.chartInstance.destroy();
            this.chartInstance = undefined;
          }

          this.chartInstance = new Chart(ctx, {
            type: 'horizontalBar',
            data: data,
            options: options,
          });
        });
      },
    },
  };
</script>