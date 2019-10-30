import { animate, style, transition, trigger } from '@angular/animations';
import { Component, OnInit, ViewEncapsulation, OnDestroy, Output, EventEmitter } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TransactionsMessageService } from './service/transactions-message.service';
import { TransactionFilterModel } from './model/transaction-filter.model';
import { Subscription } from 'rxjs/Subscription';
import { TransactionModel } from './model/transaction.model';
import { TransactionTypeService } from '../../forms/form-3x/transaction-type/transaction-type.service';
import { ReportTypeService } from '../../forms/form-3x/report-type/report-type.service';
import { FormBuilder } from '@angular/forms';
import { F3xMessageService } from '../form-3x/service/f3x-message.service';
import { ScheduleActions } from '../form-3x/individual-receipt/schedule-actions.enum';
import { IndividualReceiptService } from '../form-3x/individual-receipt/individual-receipt.service';
import { MessageService } from 'src/app/shared/services/MessageService/message.service';

export enum ActiveView {
  transactions = 'transactions',
  recycleBin = 'recycleBin',
  edit = 'edit'
}

export enum FilterTypes {
  keyword = 'keyword',
  category = 'category',
  amount = 'amount',
  aggregateAmount = 'aggregateAmount',
  date = 'date',
  deletedDate = 'deletedDate',
  state = 'state',
  memoCode = 'memoCode',
  itemizations = 'itemizations',
  electionCodes = 'electionCodes',
  electionYear = 'electionYear',
  loanAmount = 'loanAmount',
  loanClosingBalance = 'loanClosingBalance'
}

/**
 * The parent component for transactions.
 */
@Component({
  selector: 'app-transactions',
  templateUrl: './transactions.component.html',
  styleUrls: ['./transactions.component.scss'],
  encapsulation: ViewEncapsulation.None,
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [style({ opacity: 0 }), animate(500, style({ opacity: 1 }))]),
      transition(':leave', [animate(10, style({ opacity: 0 }))])
    ])
  ]
})
export class TransactionsComponent implements OnInit, OnDestroy {
  @Output() sidebarSwitch: EventEmitter<any> = new EventEmitter<any>();
  @Output() showTransaction: EventEmitter<any> = new EventEmitter<any>();

  public formType = '';
  public reportId = '0';
  public routeData: any;
  public previousReportId = '0';
  public view: ActiveView = ActiveView.transactions;
  public transactionsView = ActiveView.transactions;
  public recycleBinView = ActiveView.recycleBin;
  public editView = ActiveView.edit;
  public isShowFilters = false;
  public searchText = '';
  public searchTextArray = [];
  public tagArray: any = [];
  public transactionCategories: any = [];
  public showEditTransaction = false;

  public currentStep: string = 'step_1';
  public step: string = '';
  public steps: any = {};
  public frm: any;
  public direction: string;
  public previousStep: string = '';
  public parentTransactionCategories: any = [];
  public reportsLoading: boolean = true;
  public reportTypes: any = [];
  public reportTypeIndicator: any = {};
  public reportType: any = null;
  public selectedReportType: any = {};
  public selectedReport: any = null;
  public regularReports: boolean = false;
  public specialReports: boolean = false;
  public selectedReportInfo: any = {};
  public transactionCategory: string = '';
  public transactionTypeText = '';

  private _step: string = '';
  private _formType: string = '';

  /**
   * Subscription for applying filters to the transactions obtained from
   * the server.
   */
  private applyFiltersSubscription: Subscription;

  /**
   * Subscription for showing the TransactionsEditComponent.
   */
  private editTransactionSubscription: Subscription;

  /**
   * Subscription for showing all Transactions.
   */
  private showTransactionsSubscription: Subscription;

  public transactionToEdit: TransactionModel;

  private filters: TransactionFilterModel = new TransactionFilterModel();
  private readonly filtersLSK = 'transactions.filters';

  constructor(
    private _activatedRoute: ActivatedRoute,
    private _transactionsMessageService: TransactionsMessageService,
    private _transactionTypeService: TransactionTypeService,
    private _reportTypeService: ReportTypeService,
    private _router: Router,
    private _fb: FormBuilder,
    private _f3xMessageService: F3xMessageService,
    private _receiptService: IndividualReceiptService,
    private _messageService: MessageService
  ) {
    this.applyFiltersSubscription = this._transactionsMessageService
      .getApplyFiltersMessage()
      .subscribe((message: any) => {
        this.determineTags(message);

        if (message.isClearKeyword) {
          this.clearSearch();
        } else {
          this.doSearch();
        }
      });

    this.editTransactionSubscription = this._transactionsMessageService
      .getEditTransactionMessage()
      .subscribe((trx: TransactionModel) => {
        this.transactionToEdit = trx;
        this.showEdit();
      });

    this.showTransactionsSubscription = this._transactionsMessageService
      .getShowTransactionsMessage()
      .subscribe(message => {
        this.showTransactions();
      });

      _activatedRoute.queryParams.subscribe(p => {
        this.transactionCategory = p.transactionCategory;
      });
  }

  /**
   * Initialize the component.
   */
  public ngOnInit(): void {
    this.showEditTransaction = false;
    this.formType = this._activatedRoute.snapshot.paramMap.get('form_id');
    this.reportId = this._activatedRoute.snapshot.paramMap.get('report_id');
    const reportIdRoute = this._activatedRoute.snapshot.paramMap.get('report_id');
    this._step = this._activatedRoute.snapshot.paramMap.get('step');

    console.log('TransactionsComponent this._step', this._step);
    this.routeData = { accessedByRoute: true, formType: this.formType, reportId: reportIdRoute };

    console.log('TransactionsComponent this._step', this._step);

    localStorage.removeItem(`form_${this.formType}_view_transaction_screen`);

    this._transactionTypeService.getTransactionCategories(this.formType).subscribe(res => {
      if (res) {
        this.transactionCategories = res.data.transactionCategories;

        console.log('this.transactionCategories: ', this.transactionCategories);
      }
    });

    // If the filter was open on the last visit in the user session, open it.
    const filtersJson: string | null = localStorage.getItem(this.filtersLSK);
    let filters: TransactionFilterModel;
    if (filtersJson !== null && filtersJson !== 'null') {
      filters = JSON.parse(filtersJson);
      if (filters) {
        if (filters.keywords) {
          if (filters.keywords.length > 0) {
            this.searchTextArray = filters.keywords;
            filters.show = true;
          }
        }
      }
    } else {
      filters = new TransactionFilterModel();
    }
    if (filters.show === true) {
      this.showFilters();
    }
  }

  public ngDoCheck(): void {
    this.reportId = this._activatedRoute.snapshot.queryParams.reportId;
    if (!this.reportId) {
      return;
    }
    if (this.reportId === '0') {
      return;
    }
    if (this.reportId === this.previousReportId) {
      return;
    }
    this.previousReportId = this.reportId;
    this._receiptService.getSchedule(this._formType, { report_id: this.reportId }).subscribe(resp => {
      const message: any = {
        formType: this.formType,
        totals: resp
      };

      this._messageService.sendMessage(message);
    });
  }

  /**
   * A method to run when component is destroyed.
   */
  public ngOnDestroy(): void {
    localStorage.removeItem('Transaction_Table_Screen');
    localStorage.removeItem(`form_${this.formType}_view_transaction_screen`);
    this.applyFiltersSubscription.unsubscribe();
    this.editTransactionSubscription.unsubscribe();
    this.showTransactionsSubscription.unsubscribe();
  }

  public goToPreviousStep(): void {
    this._router.navigate([`/forms/form/${this.formType}`], {
      queryParams: { step: 'step_3' }
    });
  }

  /**
   * Based on the filter settings and search string, determine the "tags" to show.
   */
  private determineTags(message: any) {
    const filters = (this.filters = message.filters);

    // new and changed added filters should go at the end.
    // unchanged should appear in the beginning.

    if (filters.filterCategories.length > 0) {
      const categoryGroup = [];

      // is tag showing? Then modify it is the curr position
      let categoryTag = false;
      for (const tag of this.tagArray) {
        if (tag.type === FilterTypes.category) {
          categoryTag = true;
          for (const cat of filters.filterCategories) {
            categoryGroup.push(cat);
          }
          tag.group = categoryGroup;
        }
      }
      // If tag is not already showing, add it to the tag array.
      if (!categoryTag) {
        for (const cat of filters.filterCategories) {
          categoryGroup.push(cat);
        }
        this.tagArray.push({ type: FilterTypes.category, prefix: 'Type', group: categoryGroup });
      }
    } else {
      this.removeTagArrayItem(FilterTypes.category);
    }

    // Date
    if (filters.filterDateFrom && filters.filterDateTo) {
      const dateGroup = [];
      dateGroup.push({
        filterDateFrom: filters.filterDateFrom,
        filterDateTo: filters.filterDateTo
      });
      // is tag showing? Then modify it is the curr position
      let dateTag = false;
      for (const tag of this.tagArray) {
        if (tag.type === FilterTypes.date) {
          dateTag = true;
          tag.group = dateGroup;
        }
      }
      if (!dateTag) {
        this.tagArray.push({ type: FilterTypes.date, prefix: 'Date', group: dateGroup });
      }
    }

    // Amount
    if (filters.filterAmountMin && filters.filterAmountMax) {
      const amountGroup = [];
      amountGroup.push({
        filterAmountMin: filters.filterAmountMin,
        filterAmountMax: filters.filterAmountMax
      });
      let amtTag = false;
      for (const tag of this.tagArray) {
        if (tag.type === FilterTypes.amount) {
          amtTag = true;
          tag.group = amountGroup;
        }
      }
      if (!amtTag) {
        this.tagArray.push({ type: FilterTypes.amount, prefix: 'Amount', group: amountGroup });
      }
    }

    // Aggregate Amount
    if (filters.filterAggregateAmountMin && filters.filterAggregateAmountMax) {
      const amountGroup = [];
      amountGroup.push({
        filterAggregateAmountMin: filters.filterAggregateAmountMin,
        filterAggregateAmountMax: filters.filterAggregateAmountMax
      });
      let amtTag = false;
      for (const tag of this.tagArray) {
        if (tag.type === FilterTypes.aggregateAmount) {
          amtTag = true;
          tag.group = amountGroup;
        }
      }
      if (!amtTag) {
        this.tagArray.push({ type: FilterTypes.aggregateAmount, prefix: 'Aggregate Amount', group: amountGroup });
      }
    }

    // State
    if (this.filters.filterStates.length > 0) {
      const stateGroup = [];

      // is tag showing? Then modify it is the curr position
      // TODO put type strings in constants file as an enumeration
      // They are also used in the filter component as well.

      let stateTag = false;
      for (const tag of this.tagArray) {
        if (tag.type === FilterTypes.state) {
          stateTag = true;
          for (const cat of filters.filterStates) {
            stateGroup.push(cat);
          }
          tag.group = stateGroup;
        }
      }
      // If tag is not already showing, add it to the tag array.
      if (!stateTag) {
        for (const cat of filters.filterStates) {
          stateGroup.push(cat);
        }
        this.tagArray.push({ type: FilterTypes.state, prefix: null, group: stateGroup });
      }
    } else {
      this.removeTagArrayItem(FilterTypes.state);
    }

    // Memo Code
    if (this.filters.filterMemoCode) {
      // if memo tag showing, do nothing.  If not showing, add it.
      let memoTag = false;
      for (const tag of this.tagArray) {
        if (tag.type === FilterTypes.memoCode) {
          memoTag = true;
          break;
        }
      }
      if (!memoTag) {
        this.tagArray.push({ type: FilterTypes.memoCode, prefix: null, group: ['Memo Code'] });
      }
    }

    // Itemizations
    if (this.filters.filterItemizations) {
      if (this.filters.filterItemizations.length > 0) {
        const itemizedGroup = [];

        // is tag showing? Then modify it is the curr position
        // TODO put type strings in constants file as an enumeration
        // They are also used in the filter component as well.

        let itemizedTag = false;
        for (const tag of this.tagArray) {
          if (tag.type === FilterTypes.itemizations) {
            itemizedTag = true;
            for (const item of filters.filterItemizations) {
              itemizedGroup.push(item);
            }
            tag.group = itemizedGroup;
          }
        }
        // If tag is not already showing, add it to the tag array.
        if (!itemizedTag) {
          for (const item of filters.filterItemizations) {
            itemizedGroup.push(item);
          }
          this.tagArray.push({ type: FilterTypes.itemizations, prefix: 'Itemized', group: itemizedGroup });
        }
      } else {
        this.removeTagArrayItem(FilterTypes.itemizations);
      }
    }

    // Election codes
    if (this.filters.filterElectionCodes) {
      if (this.filters.filterElectionCodes.length > 0) {
        const electionCodesGroup = [];

        // is tag showing? Then modify it is the curr position
        // TODO put type strings in constants file as an enumeration
        // They are also used in the filter component as well.

        let electionsTag = false;
        for (const tag of this.tagArray) {
          if (tag.type === FilterTypes.electionCodes) {
            electionsTag = true;
            for (const item of filters.filterElectionCodes) {
              electionCodesGroup.push(item);
            }
            tag.group = electionCodesGroup;
          }
        }
        // If tag is not already showing, add it to the tag array.
        if (!electionsTag) {
          for (const item of filters.filterElectionCodes) {
            electionCodesGroup.push(item);
          }
          this.tagArray.push({ type: FilterTypes.electionCodes, prefix: 'Election code', group: electionCodesGroup });
        }
      } else {
        this.removeTagArrayItem(FilterTypes.electionCodes);
      }
    }

    // Election year
    if (this.filters.filterElectionYearFrom && this.filters.filterElectionYearTo) {
      const filterYearGroup = [];
      filterYearGroup.push({
        filterElectionYearFrom: filters.filterElectionYearFrom,
        filterElectionYearTo: filters.filterElectionYearTo
      });
      let filterYearTag = false;
      for (const tag of this.tagArray) {
        if (tag.type === FilterTypes.electionYear) {
          filterYearTag = true;
          tag.group = filterYearGroup;
        }
      }
      if (!filterYearTag) {
        this.tagArray.push({ type: FilterTypes.electionYear, prefix: 'Election year', group: filterYearGroup });
      }
    }

    console.log('tagArray: ' + JSON.stringify(this.tagArray));

    this.filters = filters;
  }

  /**
   * Search transactions.
   */
  public search() {
    // Don't allow more than 12 filters
    if (this.searchTextArray.length > 12) {
      return;
    }

    // TODO emit search message to the table transactions component
    if (this.searchText) {
      this.searchTextArray.push(this.searchText);
      this.tagArray.push({ type: FilterTypes.keyword, prefix: null, group: [this.searchText] });
      this.searchText = '';
    }
    this.doSearch();
    this.showFilters();
  }

  /**
   * Clear the keyword search items
   */
  public clearSearch() {
    this.searchTextArray = [];
    this.tagArray = [];
    this.searchText = '';
    this.doSearch();
  }

  /**
   * Clear the keyword search items
   */
  public clearSearchAndFilters() {
    // send a message to remove the filters from UI.
    this._transactionsMessageService.sendRemoveFilterMessage({ removeAll: true });

    // And reset the filter model for the search.
    this.filters = new TransactionFilterModel();

    // then clear the keywords and run the search without filters or search keywords.
    this.clearSearch();
  }

  /**
   * Remove the search text from the array.
   *
   * @param index index in the array
   */
  public removeSearchText(tagText: string) {
    const index = this.searchTextArray.indexOf(tagText);
    if (index !== -1) {
      this.searchTextArray.splice(index, 1);
      this.doSearch();
    }
  }

  /**
   * Remove the state filter tag and inform the filter component to clear it.
   */
  public removeStateFilter(index: number, state: string) {
    this.filters.filterStates.splice(index, 1);
    this.removeFilter(FilterTypes.state, state);
  }

  /**
   * Remove the State filter tag and inform the filter component to clear it.
   */
  public removeCategoryFilter(index: number, category: string) {
    this.filters.filterCategories.splice(index, 1);
    this.removeFilter(FilterTypes.category, category);
  }

  /**
   * Remove the Date filter tag and inform the filter component to clear it.
   */
  public removeDateFilter() {
    this.filters.filterDateFrom = null;
    this.filters.filterDateTo = null;
    this.removeFilter('date', null);
  }

  /**
   * Remove the Amount filter tag and inform the filter component to clear it.
   */
  public removeAmountFilter() {
    this.filters.filterAmountMin = null;
    this.filters.filterAmountMax = null;
    this.removeFilter(FilterTypes.amount, null);
  }

  /**
   * Remove the Aggregate Amount filter tag and inform the filter component to clear it.
   */
  public removeAggregateAmountFilter() {
    this.filters.filterAggregateAmountMin = null;
    this.filters.filterAggregateAmountMax = null;
    this.removeFilter(FilterTypes.aggregateAmount, null);
  }

  public removeMemoFilter() {
    this.filters.filterMemoCode = false;
    this.removeFilter(FilterTypes.memoCode, null);
  }

  /**
   * Remove the Itemized filter tag and inform the filter component to clear it.
   */
  public removeItemizationsFilter(index: number, item: string) {
    this.filters.filterItemizations.splice(index, 1);
    this.removeFilter(FilterTypes.itemizations, item);
  }

  /**
   * Remove the election codes filter tag and inform the filter component to clear it.
   */
  public removeElectionCodesFilter(index: number, item: string) {
    this.filters.filterElectionCodes.splice(index, 1);
    this.removeFilter(FilterTypes.electionCodes, item);
  }

  /**
   * Remove the election year filter tag and inform the filter component to clear it.
   */
  public removeElectionYearFilter() {
    this.filters.filterElectionYearFrom = null;
    this.filters.filterElectionYearTo = null;
    this.removeFilter(FilterTypes.electionYear, null);
  }

  /**
   * Inform the Filter Component to clear the filter settings for the given key/value.
   *
   * @param key
   * @param value
   */
  private removeFilter(key: string, value: string) {
    this._transactionsMessageService.sendRemoveFilterMessage({ key: key, value: value });
    this.doSearch();
  }

  /**
   * When a user clicks the close filter tag, delete the tag from the
   * tagsArray and inform the filter component to reset the filter setting.
   *
   * @param type filter type
   * @param index position in the array if the filter type can have multiples
   * @param tagText the text displayed on the tag
   */
  public removeTag(type: FilterTypes, index: number, tagText: string) {
    switch (type) {
      case FilterTypes.category:
        this.removeCategoryFilter(index, tagText);
        this.removeTagArrayGroupItem(type, index);
        break;
      case FilterTypes.state:
        this.removeStateFilter(index, tagText);
        this.removeTagArrayGroupItem(type, index);
        break;
      case FilterTypes.date:
        this.removeDateFilter();
        this.removeTagArrayItem(type);
        break;
      case FilterTypes.amount:
        this.removeAmountFilter();
        this.removeTagArrayItem(type);
        break;
      case FilterTypes.aggregateAmount:
        this.removeAggregateAmountFilter();
        this.removeTagArrayItem(type);
        break;
      case FilterTypes.keyword:
        this.removeSearchText(tagText);
        this.removeSearchTagArrayItem(tagText);
        break;
      case FilterTypes.memoCode:
        this.removeMemoFilter();
        this.removeTagArrayItem(type);
        break;
      case FilterTypes.itemizations:
        this.removeItemizationsFilter(index, tagText);
        this.removeTagArrayGroupItem(type, index);
        break;
      case FilterTypes.electionCodes:
        this.removeElectionCodesFilter(index, tagText);
        this.removeTagArrayGroupItem(type, index);
        break;
      case FilterTypes.electionYear:
        this.removeElectionYearFilter();
        this.removeTagArrayItem(type);
        break;
      default:
        console.log('unexpected type received for remove tag');
    }
  }

  /**
   * Remove the search keyword form the tagArray.
   */
  private removeSearchTagArrayItem(tagText: string) {
    let i = 0;
    for (const tag of this.tagArray) {
      if (tag.type === FilterTypes.keyword) {
        if (tag.group) {
          if (tag.group.length > 0) {
            if (tag.group[0] === tagText) {
              this.tagArray.splice(i, 1);
            }
          }
        }
      }
      i++;
    }
  }

  /**
   * Remove the entire object form the tagArray.
   */
  private removeTagArrayItem(type: FilterTypes) {
    let i = 0;
    let typeFound = false;
    for (const tag of this.tagArray) {
      if (tag.type === type) {
        typeFound = true;
        break;
      }
      i++;
    }
    if (typeFound) {
      this.tagArray.splice(i, 1);
    }
  }

  /**
   * An item in the tagsArray may have a group as an array where 1 item in the group array
   * is to be removed. If no group items exist after removing, the entire object
   * will be removed from the tagsArray.
   *
   * @param type filter type
   * @param index index of the group array to remove
   */
  private removeTagArrayGroupItem(type: FilterTypes, index: number) {
    let i = 0;
    for (const tag of this.tagArray) {
      if (tag.type === type) {
        if (tag.group) {
          if (tag.group.length > 0) {
            tag.group.splice(index, 1);
          }
        }
        // If no tags in the group, delete the item from the tagArray.
        if (tag.group.length === 0) {
          this.tagArray.splice(i, 1);
        }
        break;
      }
      i++;
    }
  }

  /**
   * Show the table of transactions in the recycle bin for the user.
   */
  public showRecycleBin() {
    this.view = ActiveView.recycleBin;

    // Inform the filter component of the view change
    this._transactionsMessageService.sendSwitchFilterViewMessage(ActiveView.recycleBin);
  }

  /**
   * Show the table of form transactions.
   */
  public showTransactions() {
    this.view = ActiveView.transactions;

    // Inform the filter component of the view change
    this._transactionsMessageService.sendSwitchFilterViewMessage(ActiveView.transactions);
  }

  /**
   * Show edit for a single transaction.
   */
  public showEdit() {
    const emptyValidForm = this._fb.group({});
    this.showTransaction.emit({
      form: emptyValidForm,
      direction: 'next',
      step: 'step_3',
      previousStep: 'transactions',
      action: ScheduleActions.edit,
      transactionCategory: this.transactionCategory,
      scheduleType: this.transactionToEdit.scheduleType,
      transactionDetail: {
        transactionModel: this.transactionToEdit
      }
    });

    this.showCategories();

    // let accessedByRoute = false;
    // if (this.routeData) {
    //   if (this.routeData.accessedByRoute && this.routeData.reportId) {
    //     accessedByRoute = true;
    //   }
    // }

    // // TODO remove for edit route and accessedByRoute if not used.  Does not appear to be.
    // if (accessedByRoute) {
    //   // this._router.navigate([`/forms/form/${this.formType}`], {
    //   //   queryParams: { step: 'step_3' }
    //   // });

    //   this._router.navigate([`/forms/form/edit/${this.formType}/${this.routeData.reportId}`]);
    //   const editOrView = { action: ScheduleActions.edit, transactionModel: this.transactionToEdit };
    //   this._f3xMessageService.sendPopulateFormMessage(editOrView);
    //   // this.showEditTransaction = true;
    // } else {
    //   const emptyValidForm = this._fb.group({});
    //   this.showTransaction.emit({
    //     form: emptyValidForm,
    //     direction: 'next',
    //     step: 'step_3',
    //     previousStep: 'transactions',
    //     editOrView: { action: ScheduleActions.edit, transactionModel: this.transactionToEdit }
    //   });
    // }
  }

  /**
   * Show the option to select/deselect columns in the table.
   */
  public showPinColumns() {
    this.showTransactions();
    this._transactionsMessageService.sendShowPinColumnMessage('show the Pin Col');
  }

  /**
   * Import transactions from an external file.
   */
  public doImport() {
    alert('Import transactions is not yet supported');
  }

  /**
   * Show filter options for transactions.
   */
  public showFilters() {
    this.isShowFilters = true;
    this.sidebarSwitch.emit(this.isShowFilters);
  }

  /**
   * Show the categories and hide the filters.
   */
  public showCategories() {
    this.isShowFilters = false;
    this.sidebarSwitch.emit(false);
  }

  /**
   * Check if the view to show is Transactions.
   */
  public isTransactionViewActive() {
    return this.view === this.transactionsView ? true : false;
  }

  /**
   * Check if the view to show is Recycle Bin.
   */
  public isRecycleBinViewActive() {
    return this.view === this.recycleBinView ? true : false;
  }

  /**
   * Check if the view to show is Edit.
   */
  public isEditViewActive() {
    return this.view === this.editView ? true : false;
  }

  /**
   * Send a message to the subscriber to run the search.
   */
  private doSearch() {
    this.filters.keywords = this.searchTextArray;
    this._transactionsMessageService.sendDoKeywordFilterSearchMessage(this.filters);
  }

  public printPreview(): void {
    console.log('TransactionsTableComponent printPreview...!');

    this._reportTypeService.printPreview('transaction_table_screen', '3X');
  }
}
