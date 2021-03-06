<template>
  <div>
    <div class="panel panel-default">

      <div v-if="!!title" class="panel-heading pt-56 pb-16">
        <h4 class="no-margin"> {{ title }} </h4>
      </div>

      <div v-if="!!getSearchResultTitle()" class="clear p-10">
        <b v-html="getSearchResultTitle()" />
      </div>

      <div v-if="!!getSearchResultMessage()" class="clear p-10">
        <div v-html="getSearchResultMessage()" />
      </div>

      <div v-if="!isHideDatepicker && rows && rows.length" class="datepicker-container">
        <span>{{ $t('filter.from') }}</span>
        <datepicker v-model="searchFromDate" name="searchFromDate" class="calendar-icon"
          :language="locale"
          :format="formatDatepicker"
          :clear-button="true"
          :highlighted="highlightedToday"
          :disabled="disabledFromDates">
        </datepicker>
        <span>{{ $t('filter.to') }}</span>
        <datepicker v-model="searchToDate" name="searchToDate" class="calendar-icon"
          :language="locale"
          :format="formatDatepicker"
          :clear-button="true"
          :highlighted="highlightedToday"
          :disabled="disabledToDates">
        </datepicker>
      </div>

      <paginate v-if="maxPage > 1"
        ref="topPaginator"
        :page-count="maxPage"
        :initial-page="currentPage"
        :page-range="1"
        :click-handler="clickToPage"
        :prev-text="$t('token_list.prev')"
        :next-text="$t('token_list.next')"
        :container-class="'pagination'"
        :page-class="'page-item'"
        :page-link-class="'page-link'"
        :prev-class="'page-item'"
        :prev-link-class="'page-link'"
        :next-class="'page-item'"
        :next-link-class="'page-link'"
        :active-class="'active'"
        :class="'home-pagination-block full-width-pagination'"
        >
      </paginate>

      <div v-if="rows.length > 0" class="table-responsive-wraper clear pt-10">
        <table class="table table-hover table-responsive table-round">
          <thead>
            <tr>
              <th>{{ $t("trade_list.date") }}</th>
              <th colspan="3" class="text-center">{{ $t("trade_list.exchange_from") }}</th>
              <th colspan="2" class="text-center">{{ $t("trade_list.exchange_to") }}</th>
              <th colspan="2" class="text-center">{{ $t("trade_list.rate") }}</th>
              <th v-if="!isHidePartnerCommission" class="text-right">{{ $t("trade_list.fee_to_wallet") }}</th>
              <th class="text-right">{{ $t("trade_list.fee_to_burn") }}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, index) in rows" :item="row" :index="index" @click="onClickRow(row)">
              <td>{{ getDateInfo(row) }}</td>
              <td class="text-right no-padding-right">{{ formatTokenNumber(row.takerTokenSymbol, row.takerTokenAmount) }}</td>
              <td class="text-left no-padding-right">{{ row.takerTokenSymbol }}</td>
              <td class="text-center"><i class="k k-angle right"></i></td>
              <td class="text-right no-padding-right no-padding-left">{{ formatTokenNumber(row.makerTokenSymbol, row.makerTokenAmount) }}</td>
              <td class="text-left">{{ row.makerTokenSymbol }}</td>
              <td class="text-right no-padding-left no-padding-right">1 {{ row.takerTokenSymbol }} = {{ getRate(row) }}</td>
              <td>{{ row.makerTokenSymbol }}</td>
              <td v-if="!isHidePartnerCommission"  class="text-right">{{ formatTokenNumber('KNC', row.takerFee) }} KNC</td>
              <td class="text-right no-padding-right">{{ formatTokenNumber('KNC', row.burnFees) }} KNC</td>
              <td><span class="pull-right ml-10">
                <i class="k k-angle right"></i>
              </span></td>
            </tr>
          </tbody>
        </table>
      </div>

      <paginate v-if="maxPage > 1"
        ref="bottomPaginator"
        :page-count="maxPage"
        :initial-page="currentPage"
        :page-range="1"
        :click-handler="clickToPage"
        :prev-text="$t('token_list.prev')"
        :next-text="$t('token_list.next')"
        :container-class="'pagination'"
        :page-class="'page-item'"
        :page-link-class="'page-link'"
        :prev-class="'page-item'"
        :prev-link-class="'page-link'"
        :next-class="'page-item'"
        :next-link-class="'page-link'"
        :active-class="'active'"
        :class="'home-pagination-block full-width-pagination'"
        >
      </paginate>

    </div>
  </div>
</template>

<script>

import _ from 'lodash';
import io from 'socket.io-client';
import moment from 'moment';
import BigNumber from 'bignumber.js';
import AppRequest from '../request/AppRequest';
import util from '../helper/util';
import network from '../../../../../config/network';

export default {
  props: {
    getFilterTokenSymbol: {
      type: Function,
    },
    title: {
      type: String,
    },
    pageSize: {
      type: Number,
    },
    isHidePartnerCommission: {
      type: Boolean
    },
    getSearchResultMessage: {
      type: Function,
      default: function () {
        if (this.rows && this.rows.length) {
          return '';
        }

        return this.$t("trade_list.msg_no_result");
      }
    },
    getSearchResultTitle: {
      type: Function,
      default: () => ""
    },
    fetch: {
      type: Function,
      default: function () {
        const params = this.getRequestParams();
        AppRequest
          .getTrades(this.currentPage, this.pageSize || 20, params, (err, res) => {
            const data = res.data;
            const pagination = res.pagination;
            this.rows = data;
            this.maxPage = pagination.maxPage;
          });
      }
    },
    isHideDatepicker: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      rows: [],
      currentPage: 0,
      maxPage: 0,
      searchFromDate: null,
      searchToDate: null,
      tokens: _.keyBy(_.values(network.tokens), 'symbol'),
      highlightedToday: {
        dates: [new Date()]
      },
      disabledFromDates: {
        //
      },
      disabledToDates: {
        //
      }
    };
  },
  methods: {
    getRequestParams () {
      const params = {
        symbol: this.getFilterTokenSymbol(),
        fromDate: this.searchFromDate ? moment(this.searchFromDate).startOf('day').unix() : undefined,
        toDate: this.searchToDate ? moment(this.searchToDate).endOf('day').unix() : undefined,
      };

      return params;
    },
    getDateInfo (trade) {
      return util.getDateInfo(trade.blockTimestamp * 1000);
    },
    getRate (trade) {
      const makerToken = this.tokens[trade.makerTokenSymbol];
      const takerToken = this.tokens[trade.takerTokenSymbol];

      const makerAmount = (new BigNumber(trade.makerTokenAmount.toString())).div(Math.pow(10, makerToken.decimal));
      const takerAmount = (new BigNumber(trade.takerTokenAmount.toString())).div(Math.pow(10, takerToken.decimal));
      return util.roundingNumber(makerAmount.div(takerAmount).toNumber());
    },
    formatTokenNumber (symbol, amount) {
      const tokenInfo = this.tokens[symbol];
      return util.formatTokenAmount(amount, tokenInfo.decimal);
    },
    formatDatepicker (date) {
      if (util.getLocale() === 'vi') {
        return moment(date).format('DD/MM/YYYY');
      } else {
        return moment(date).format('DD MMM YYYY');
      }
    },
    getTradeLink (id) {
      return `/trades/${id}`;
    },
    onClickRow (row) {
      this.$router.push({
        name: 'trade-details',
        params: {
          id: row.id
        }
      });
    },
    clickToPage (page) {
      this.currentPage = this.$refs.topPaginator.selected = this.$refs.bottomPaginator.selected = page - 1;
      this.fetch();
    },
  },
  computed: {
    locale () {
      return util.getLocale();
    }
  },
  watch: {
    searchFromDate (val) {
      const fromDate = val ? val.getTime() : 0;
      const toDate = this.searchToDate ? this.searchToDate.getTime() : 0;
      if (fromDate > 0 && toDate > 0 && fromDate > toDate) {
        window.EventBus.$emit('EVENT_COMMON_ERROR', `From-date must be equal or less than to-date`);
        window.setTimeout(() => {
          this.searchFromDate = null;
        });
        return;
      }

      window.setTimeout(() => {
        this.disabledToDates = { to: this.searchFromDate };
        this.fetch();
      });
    },
    searchToDate (val) {
      const toDate = val ? val.getTime() : 0;
      const fromDate = this.searchFromDate ? this.searchFromDate.getTime() : 0;
      if (fromDate > 0 && toDate > 0 && fromDate > toDate) {
        window.EventBus.$emit('EVENT_COMMON_ERROR', `To-date must be equal or greater than from-date`);
        window.setTimeout(() => {
          this.searchToDate = null;
        });
        return;
      }

      window.setTimeout(() => {
        this.disabledFromDates = { from: this.searchToDate };
        this.fetch();
      });
    }
  }
};
</script>

<style language="css">
  .vdp-datepicker__calendar .cell.day-header {
    white-space: nowrap;
  }
  .not-found-message {
    width: 100%;
    text-align: center;
  }
</style>>