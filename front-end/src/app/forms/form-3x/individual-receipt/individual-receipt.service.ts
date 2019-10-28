import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, identity } from 'rxjs';
import { map } from 'rxjs/operators';
import { CookieService } from 'ngx-cookie-service';
import { UtilService } from '../../../shared/utils/util.service';
import { environment } from '../../../../environments/environment';
import { ScheduleActions } from './schedule-actions.enum';
import { TransactionModel } from '../../transactions/model/transaction.model';
import { DecimalPipe } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class IndividualReceiptService {
  private readonly _memoCodeValue: string = 'X';

  constructor(
    private _http: HttpClient,
    private _cookieService: CookieService,
    private _utilService: UtilService,
    private _decimalPipe: DecimalPipe
  ) {
    console.log();
  }

  /**
   * Gets the dynamic form fields.
   *
   * @param      {string}  formType         The form type
   * @param      {string}  transactionType  The transaction type
   */
  public getDynamicFormFields(formType: string, transactionType: string): Observable<any> {
    const token: string = JSON.parse(this._cookieService.get('user'));
    const url: string = `${environment.apiUrl}/core/get_dynamic_forms_fields`;
    let httpOptions = new HttpHeaders();
    let params = new HttpParams();
    let formData: FormData = new FormData();

    httpOptions = httpOptions.append('Content-Type', 'application/json');
    httpOptions = httpOptions.append('Authorization', 'JWT ' + token);

    params = params.append('form_type', `F${formType}`);
    params = params.append('transaction_type', transactionType);

    return this._http.get(url, {
      headers: httpOptions,
      params
    });
  }

  /**
   * Gets the Levin account details.
   *
   */
  public getLevinAccounts(): Observable<any> {
    const token: string = JSON.parse(this._cookieService.get('user'));
    const url: string = `${environment.apiUrl}/core/levin_accounts`;
    let httpOptions = new HttpHeaders();
    httpOptions = httpOptions.append('Content-Type', 'application/json');
    httpOptions = httpOptions.append('Authorization', 'JWT ' + token);

    return this._http.get(url, {
      headers: httpOptions
    });
  }

  /**
   * Saves a schedule.
   *
   * @param      {string}           formType  The form type
   * @param      {ScheduleActions}  scheduleAction  The type of action to save (add, edit)
   */
  public saveSchedule(formType: string, scheduleAction: ScheduleActions): Observable<any> {
    const token: string = JSON.parse(this._cookieService.get('user'));
    let url: string = '/sa/schedA';
    const committeeDetails: any = JSON.parse(localStorage.getItem('committee_details'));
    let reportType: any = JSON.parse(localStorage.getItem(`form_${formType}_report_type`));

    if (reportType === null || typeof reportType === 'undefined') {
      reportType = JSON.parse(localStorage.getItem(`form_${formType}_report_type_backup`));
    }

    const transactionType: any = JSON.parse(localStorage.getItem(`form_${formType}_transaction_type`));
    const receipt: any = JSON.parse(localStorage.getItem(`form_${formType}_receipt`));
    const formData: FormData = new FormData();

    let httpOptions = new HttpHeaders();

    httpOptions = httpOptions.append('Authorization', 'JWT ' + token);

    /**
     * This has to be removed.
     * I'm not hard coding anything any more.
     * Or this has to be changed to just lower case.  This is not a
     * good practice at all.  Please do better then this.
     */
    formData.append('cmte_id', committeeDetails.committeeid);
    // With Edit Report Functionality
    if (reportType.hasOwnProperty('reportId')) {
      formData.append('report_id', reportType.reportId);
    } else if (reportType.hasOwnProperty('reportid')) {
      formData.append('report_id', reportType.reportid);
    }

    console.log();

    for (const [key, value] of Object.entries(receipt)) {
      if (value !== null) {
        if (typeof value === 'string') {
          formData.append(key, value);
        }
      }
    }

    if (receipt.hasOwnProperty('api_call')) {
      if (receipt.api_call) {
        url = receipt.api_call;
      }
    }

    if (scheduleAction === ScheduleActions.add || scheduleAction === ScheduleActions.addSubTransaction) {
      return this._http
        .post(`${environment.apiUrl}${url}`, formData, {
          headers: httpOptions
        })
        .pipe(
          map(res => {
            if (res) {
              return res;
            }
            return false;
          })
        );
    } else if (scheduleAction === ScheduleActions.edit) {
      return this._http
        .put(`${environment.apiUrl}${url}`, formData, {
          headers: httpOptions
        })
        .pipe(
          map(res => {
            if (res) {
              return res;
            }
            return false;
          })
        );
    } else {
      console.log('unexpected ScheduleActions received - ' + scheduleAction);
    }
  }

  /**
   * Saves a schedule a using POST.  The POST API supports saving an existing
   * transaction.  Therefore, transaction_id is required in this API call.
   *
   * TODO consider modifying saveScheduleA() to support both POST and PUT.
   *
   * @param      {string}  formType  The form type
   */
  public putScheduleA(formType: string): Observable<any> {
    const token: string = JSON.parse(this._cookieService.get('user'));
    const url: string = '/sa/schedA';
    const committeeDetails: any = JSON.parse(localStorage.getItem('committee_details'));
    let reportType: any = JSON.parse(localStorage.getItem(`form_${formType}_report_type`));

    if (reportType === null || typeof reportType === 'undefined') {
      reportType = JSON.parse(localStorage.getItem(`form_${formType}_report_type_backup`));
    }

    const transactionType: any = JSON.parse(localStorage.getItem(`form_${formType}_transaction_type`));
    const receipt: any = JSON.parse(localStorage.getItem(`form_${formType}_receipt`));

    let httpOptions = new HttpHeaders();
    const formData: FormData = new FormData();

    httpOptions = httpOptions.append('Authorization', 'JWT ' + token);

    // Needed for update but not for add
    formData.append('transaction_id', receipt.transactionId);

    formData.append('cmte_id', committeeDetails.committeeid);
    // With Edit Report Functionality
    if (reportType.hasOwnProperty('reportId')) {
      formData.append('report_id', reportType.reportId);
    } else if (reportType.hasOwnProperty('reportid')) {
      formData.append('report_id', reportType.reportid);
    }

    // formData.append('report_id', reportType.reportId);
    formData.append('transaction_type', '15');
    formData.append('line_number', '11AI');
    formData.append('first_name', receipt.ContributorFirstName);
    formData.append('last_name', receipt.ContributorLastName);
    formData.append('state', receipt.ContributorState);
    formData.append('city', receipt.ContributorCity);
    formData.append('zip_code', receipt.ContributorZip);
    formData.append('occupation', receipt.ContributorOccupation);
    formData.append('employer', receipt.ContributorEmployer);
    formData.append('contribution_amount', receipt.ContributionAmount);
    formData.append('contribution_date', receipt.ContributionDate);
    // formData.append('contribution_aggregate', receipt.ContributionAggregate);
    formData.append('entity_type', receipt.EntityType);
    if (receipt.ContributorMiddleName !== null) {
      if (typeof receipt.ContributorMiddleName === 'string') {
        formData.append('middle_name', receipt.ContributorMiddleName);
      }
    }
    if (receipt.ContributorPrefix !== null) {
      if (typeof receipt.ContributorPrefix === 'string') {
        formData.append('prefix', receipt.ContributorPrefix);
      }
    }
    if (receipt.ContributorSuffix !== null) {
      if (typeof receipt.ContributorSuffix === 'string') {
        formData.append('suffix', receipt.ContributorSuffix);
      }
    }
    formData.append('street_1', receipt.ContributorStreet1);
    if (receipt.ContributorStreet2 !== null) {
      if (typeof receipt.ContributorStreet2 === 'string') {
        formData.append('street_2', receipt.ContributorStreet2);
      }
    }
    if (receipt.MemoText !== null) {
      if (typeof receipt.MemoText === 'string') {
        formData.append('memo_text', receipt.MemoText);
      }
    }
    if (receipt.MemoCode !== null) {
      if (typeof receipt.MemoCode === 'string') {
        formData.append('memo_code', receipt.MemoCode);
      }
    }
    if (receipt.ContributionPurposeDescription !== null) {
      if (typeof receipt.ContributionPurposeDescription === 'string') {
        formData.append('purpose_description', receipt.ContributionPurposeDescription);
      }
    }

    return this._http
      .put(`${environment.apiUrl}${url}`, formData, {
        headers: httpOptions
      })
      .pipe(
        map(res => {
          if (res) {
            return res;
          }
          return false;
        })
      );
  }

  /**
   * Gets the schedule after submitted.
   *
   * @param      {string}  reportId  The report Id
   * @param      {string}  transactionId   The Transaction Id
   * @param      {string}  apiCall   This parameter derives the API call
   */
  public getDataSchedule(reportId: string, transactionId: string, apiCall: string): Observable<any> {
    const token: string = JSON.parse(this._cookieService.get('user'));
    const url: string = `${environment.apiUrl}${apiCall}`;
    let httpOptions = new HttpHeaders();

    httpOptions = httpOptions.append('Authorization', 'JWT ' + token);

    let params = new HttpParams();
    params = params.append('report_id', reportId);
    if (transactionId) {
      params = params.append('transaction_id', transactionId);
    }

    return this._http.get(url, {
      headers: httpOptions,
      params: params
    });
  }

  /**
   * Gets the schedule after submitted.
   *
   * @param      {string}  formType  The form type
   * @param      {any}     receipt   The receipt
   */
  public getSchedule(formType: string, receipt: any): Observable<any> {
    const token: string = JSON.parse(this._cookieService.get('user'));
    const url: string = `${environment.apiUrl}/core/thirdNavTransactionTypes`;
    const data: any = JSON.stringify(receipt);
    let httpOptions = new HttpHeaders();

    httpOptions = httpOptions.append('Authorization', 'JWT ' + token);

    return this._http.get(url, {
      headers: httpOptions,
      params: {
        report_id: receipt.report_id
      }
    });
  }

  /**
   * Returns aggregate total for contributor.
   *
   * @param      {number}  reportId                   The report identifier
   * @param      {string}  entityId                   The entity identifier
   * @param      {string}  transactionTypeIdentifier  The transaction type
   */
  public getContributionAggregate(
    reportId: string,
    entityId: number,
    cmteId: string,
    transactionTypeIdentifier: string,
    contributionDate: string
  ): Observable<any> {
    const token: string = JSON.parse(this._cookieService.get('user'));
    const url = '/sa/contribution_aggregate';
    let httpOptions = new HttpHeaders();
    let params = new HttpParams();

    httpOptions = httpOptions.append('Content-Type', 'application/json');
    httpOptions = httpOptions.append('Authorization', 'JWT ' + token);

    params = params.append('report_id', reportId);
    if (entityId) {
      params = params.append('entity_id', entityId.toString());
    }
    if (cmteId) {
      params = params.append('cmte_id', cmteId.toString());
    }
    params = params.append('transaction_type_identifier', transactionTypeIdentifier);
    params = params.append('contribution_date', contributionDate);

    return this._http.get(`${environment.apiUrl}${url}`, {
      headers: httpOptions,
      params
    });
  }

  public getFedNonFedPercentage__(amount: string, activityEvent: string): Observable<any> {
    const token: string = JSON.parse(this._cookieService.get('user'));
    const url = '/sh1/get_h1_percentage';
    let httpOptions = new HttpHeaders();
    let params = new HttpParams();

    httpOptions = httpOptions.append('Content-Type', 'application/json');
    httpOptions = httpOptions.append('Authorization', 'JWT ' + token);

    const committeeDetails: any = JSON.parse(localStorage.getItem('committee_details'));
    // params.append('cmte_id', committeeDetails.committeeid);
    // params.append('activity_event_type', activityEvent);
    params = params.append('calendar_year', new Date().getFullYear().toString());

    if (amount) {
      // params = params.append('total_amount', amount.toString());
    }

    return this._http.get(`${environment.apiUrl}${url}`, {
      headers: httpOptions,
      params
    });
  }

  public getFedNonFedPercentage(amount: string, activityEvent: string): Observable<any> {
    const token: string = JSON.parse(this._cookieService.get('user'));
    const url = '/sh1/get_fed_nonfed_share';
    let httpOptions = new HttpHeaders();
    let params = new HttpParams();

    httpOptions = httpOptions.append('Content-Type', 'application/json');
    httpOptions = httpOptions.append('Authorization', 'JWT ' + token);

    const committeeDetails: any = JSON.parse(localStorage.getItem('committee_details'));
    if (committeeDetails) {
      if (committeeDetails.cmte_type_category) {
        params = params.append('cmte_type_category', committeeDetails.cmte_type_category);
      }
    }

    params = params.append('calendar_year', new Date().getFullYear().toString());
    if (amount) {
      params = params.append('total_amount', amount.toString());
    }
    if (activityEvent) {
      params = params.append('activity_event_type', 'administrative');
    }

    return this._http.get(`${environment.apiUrl}${url}`, {
      headers: httpOptions,
      params
    });
  }

  /**
   * Obtain the Report ID from local storage.
   */
  public getReportIdFromStorage(formType: string) {
    let reportId = '0';
    let form3XReportType = JSON.parse(localStorage.getItem(`form_${formType}_report_type`));
    const reportIdFromLocalStorage = localStorage.getItem('reportId');

    if (form3XReportType === null || typeof form3XReportType === 'undefined') {
      form3XReportType = JSON.parse(localStorage.getItem(`form_${formType}_report_type_backup`));
    }

    console.log('viewTransactions form3XReportType', form3XReportType);

    if (typeof form3XReportType === 'object' && form3XReportType !== null) {
      if (form3XReportType.hasOwnProperty('reportId')) {
        reportId = form3XReportType.reportId;
      } else if (form3XReportType.hasOwnProperty('reportid')) {
        reportId = form3XReportType.reportid;
      }
    } else if (reportIdFromLocalStorage !== null && reportIdFromLocalStorage !== undefined && reportIdFromLocalStorage !== '0') {
      reportId = reportIdFromLocalStorage;
    }
    return reportId;
  }

  /**
   * Calculate the aggregate amount to display based on business rules.
   *
   * Some of the variables are:
   * 1) Add or Edit action
   * 2) Selected entity is true or false
   * 3) Memo is checked or not
   * 4) Is sub transaction
   * 5) Did data change on an edit (date, memo, amount)
   *
   * Note: the FormGroup could be passed in rather than overloading the method with arguments.
   * It is not to allow for easier test scripting but should be changed later if desired.
   *
   * @param selectedEntityAggregate
   * @param amount
   * @param scheduleAction
   * @param memoCode
   * @param selectedEntity
   * @param transactionToEdit
   * @param transactionType
   */
  public determineAggregate(
    selectedEntityAggregate: number,
    amount: number,
    scheduleAction: string,
    memoCode: boolean,
    selectedEntity: any,
    transactionToEdit: TransactionModel,
    transactionType: string,
    isSubTransaction: boolean,
    transactionDate: string
  ): string {
    let aggregate = 0;
    amount = amount ? amount : 0;
    selectedEntityAggregate = selectedEntityAggregate ? selectedEntityAggregate : 0;

    if (scheduleAction === ScheduleActions.add || scheduleAction === ScheduleActions.addSubTransaction) {
      aggregate = this._determineAggregateHelper(selectedEntityAggregate, amount, memoCode, isSubTransaction);
      return this._decimalPipe.transform(aggregate, '.2-2');
    } else if (scheduleAction === ScheduleActions.edit) {
      if (!transactionToEdit) {
        return this._decimalPipe.transform(aggregate, '.2-2');
      }
      // If nothing has changed, show the original.
      const origDate = transactionToEdit.date ? transactionToEdit.date.toString() : null;
      if (transactionDate === origDate) {
        if (
          (memoCode && transactionToEdit.memoCode === this._memoCodeValue) ||
          (!memoCode && transactionToEdit.memoCode !== this._memoCodeValue)
        ) {
          if (amount === transactionToEdit.amount) {
            aggregate = transactionToEdit.aggregate;
            return this._decimalPipe.transform(aggregate, '.2-2');
          }
        }
      }
      if (selectedEntity) {
        if (selectedEntity.entity_id) {
          if (selectedEntity.entity_id === transactionToEdit.entityId) {
            let origAmt = transactionToEdit.amount ? transactionToEdit.amount : 0;
            if (isSubTransaction === false) {
              if (transactionToEdit.memoCode === this._memoCodeValue) {
                origAmt = 0;
              }
              if (memoCode) {
                amount = 0;
              }
            }
            // selected entity is same on saved transaction
            // backout the old amount from aggregate and
            // apply new (if memo was check on old or new they will be 0 for parent).
            aggregate = selectedEntityAggregate - origAmt + amount;
          } else {
            // selected entity differs from saved transaction
            // don't back out the saved amount from aggregate
            // apply new if memo not checked.

            aggregate = this._determineAggregateHelper(selectedEntityAggregate, amount, memoCode, isSubTransaction);
            return this._decimalPipe.transform(aggregate, '.2-2');
          }
        }
      } else {
        // edit for entity not selected, same as add no entity aggregate to include
        aggregate = this._determineAggregateHelper(selectedEntityAggregate, amount, memoCode, isSubTransaction);
        return this._decimalPipe.transform(aggregate, '.2-2');
      }
    } else {
      // some other action
    }
    return this._decimalPipe.transform(aggregate, '.2-2');
  }

  private _determineAggregateHelper(
    selectedEntityAggregate: number,
    amount: number,
    memoCode: boolean,
    isSubTransaction: boolean
  ): number {
    let aggregate = 0;
    if (isSubTransaction === false) {
      if (memoCode) {
        aggregate = selectedEntityAggregate;
      } else {
        aggregate = amount + selectedEntityAggregate;
      }
    } else {
      // Sub transactions always get the amount added to aggregate
      // even if memo is checked/disabled.  If the rules change or we encounter
      // a memo subtran that requires user changes to memo, handle it here.
      aggregate = amount + selectedEntityAggregate;
    }
    return aggregate;
  }
}
