import { Component, OnInit, Input, Output, EventEmitter, SimpleChanges, OnChanges } from '@angular/core';
import { FormGroup, FormBuilder, FormControl, Validators } from '@angular/forms';
import { ScheduleActions } from '../form-3x/individual-receipt/schedule-actions.enum';
import { ContactsService } from 'src/app/contacts/service/contacts.service';
import { alphaNumeric } from 'src/app/shared/utils/forms/validation/alpha-numeric.validator';
import { Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { TypeaheadService } from 'src/app/shared/partials/typeahead/typeahead.service';
import { NgbTypeaheadSelectItemEvent } from '@ng-bootstrap/ng-bootstrap';
import { SchedC1Service } from './service/sched-c1.service';
import { DecimalPipe } from '@angular/common';
import { Sections } from './sections.enum';
import { UtilService } from 'src/app/shared/utils/util.service';

@Component({
  selector: 'app-sched-c1',
  templateUrl: './sched-c1.component.html',
  styleUrls: ['./sched-c1.component.scss']
})
export class SchedC1Component implements OnInit, OnChanges {
  @Input() formType: string;
  @Input() scheduleAction: ScheduleActions;
  @Input() forceChangeDetection: Date;
  @Output() status: EventEmitter<any> = new EventEmitter<any>();

  public c1Form: FormGroup;
  public sectionType: string;
  public states: any[];
  public readonly initialSection = Sections.initialSection;
  public readonly sectionA = Sections.sectionA;
  public readonly sectionB = Sections.sectionB;
  public readonly sectionC = Sections.sectionC;
  public readonly sectionD = Sections.sectionD;
  public readonly sectionE = Sections.sectionE;
  public readonly sectionF = Sections.sectionF;
  public readonly sectionG = Sections.sectionG;
  public readonly sectionH = Sections.sectionH;
  public readonly sectionI = Sections.sectionI;
  public file: any = null;
  public fileNameToDisplay: string = null;
  // TODO check requirements for each amount field.
  public _contributionAmountMax = 14;

  public fieldLoanAmount = { name: 'loan_amount' };

  constructor(
    private _fb: FormBuilder,
    private _contactsService: ContactsService,
    private _typeaheadService: TypeaheadService,
    private _schedC1Service: SchedC1Service,
    private _decimalPipe: DecimalPipe,
    private _utilService: UtilService
  ) {}

  public ngOnInit() {
    this.sectionType = Sections.initialSection;
    this._getStates();
    this._setFormGroup();
  }

  public ngOnChanges(changes: SimpleChanges) {
    this._clearFormValues();
    if (this.scheduleAction === ScheduleActions.edit) {
      // TODO populate form using API response from schedC.
    }
  }

  public formatSectionType() {
    switch (this.sectionType) {
      case Sections.sectionA:
        return 'Section A';
      case Sections.sectionB:
        return 'Section B';
      case Sections.sectionC:
        return 'Section C';
      case Sections.sectionD:
        return 'Section D';
      case Sections.sectionE:
        return 'Section E';
      case Sections.sectionF:
        return 'Section F';
      case Sections.sectionG:
        return 'Section G';
      case Sections.sectionH:
        return 'Section H';
      case Sections.sectionI:
        return 'Section I';
      default:
        return '';
    }
  }

  /**
   * Validate section before proceeding to the next.
   */
  public showNextSection() {
    // Mark as touched if user clicks next on an untouched, invalid form
    // to display fields in error.
    this.c1Form.markAsTouched();

    switch (this.sectionType) {
      case Sections.initialSection:
        if (this._checkSectionValid()) {
          // mark as untouched so fields on new section/screen do not show as invalid
          this.c1Form.markAsUntouched();
          this.sectionType = Sections.sectionA;
        }
        break;
      case Sections.sectionA:
        if (this._checkSectionValid()) {
          // mark as untouched so fields on new section/screen do not show as invalid
          this.c1Form.markAsUntouched();
          this.sectionType = Sections.sectionB;
        }
        break;
      case Sections.sectionB:
        if (this._checkSectionValid()) {
          // mark as untouched so fields on new section/screen do not show as invalid
          this.c1Form.markAsUntouched();
          this.sectionType = Sections.sectionC;
        }
        break;
      case Sections.sectionC:
        if (this._checkSectionValid()) {
          // mark as untouched so fields on new section/screen do not show as invalid
          this.c1Form.markAsUntouched();
          this.sectionType = Sections.sectionD;
        }
        break;
      case Sections.sectionD:
        if (this._checkSectionValid()) {
          // mark as untouched so fields on new section/screen do not show as invalid
          this.c1Form.markAsUntouched();
          this.sectionType = Sections.sectionE;
        }
        break;
      case Sections.sectionE:
        if (this._checkSectionValid()) {
          // mark as untouched so fields on new section/screen do not show as invalid
          this.c1Form.markAsUntouched();
          this.sectionType = Sections.sectionF;
        }
        break;
      case Sections.sectionF:
        if (this._checkSectionValid()) {
          // mark as untouched so fields on new section/screen do not show as invalid
          this.c1Form.markAsUntouched();
          this.sectionType = Sections.sectionG;
        }
        break;
      case Sections.sectionG:
        if (this._checkSectionValid()) {
          // mark as untouched so fields on new section/screen do not show as invalid
          this.c1Form.markAsUntouched();
          this.sectionType = Sections.sectionH;
        }
        break;
      case Sections.sectionH:
        if (this._checkSectionValid()) {
          // mark as untouched so fields on new section/screen do not show as invalid
          this.c1Form.markAsUntouched();
          this.sectionType = Sections.sectionI;
        }
        break;
      default:
        this.sectionType = Sections.initialSection;
    }
  }

  /**
   * Show previous section.  No need to validate.
   */
  public showPreviousSection() {
    switch (this.sectionType) {
      case Sections.sectionA:
        this.sectionType = Sections.initialSection;
        break;
      case Sections.sectionB:
        this.sectionType = Sections.sectionA;
        break;
      case Sections.sectionC:
        this.sectionType = Sections.sectionB;
        break;
      case Sections.sectionD:
        this.sectionType = Sections.sectionC;
        break;
      case Sections.sectionE:
        this.sectionType = Sections.sectionD;
        break;
      case Sections.sectionF:
        this.sectionType = Sections.sectionE;
        break;
      case Sections.sectionG:
        this.sectionType = Sections.sectionF;
        break;
      case Sections.sectionH:
        this.sectionType = Sections.sectionG;
        break;
      case Sections.sectionI:
        this.sectionType = Sections.sectionH;
        break;
      default:
      // this.sectionType = Sections.initialSection;
    }
  }

  private _checkSectionValid(): boolean {
    switch (this.sectionType) {
      case Sections.initialSection:
        return this._checkInitialSectionValid();
      case Sections.sectionA:
        return this._checkSectionAValid();
      case Sections.sectionB:
        return this._checkSectionBValid();
      case Sections.sectionC:
        return this._checkSectionCValid();
      case Sections.sectionD:
        return this._checkSectionDValid();
      case Sections.sectionE:
        return this._checkSectionEValid();
      case Sections.sectionF:
        return this._checkSectionFValid();
      case Sections.sectionG:
        return this._checkSectionGValid();
      case Sections.sectionH:
        return this._checkSectionHValid();
      default:
        return true;
    }
  }

  private _checkInitialSectionValid(): boolean {
    // comment out for ease of dev testing - add back later.
    if (!this._checkFormFieldIsValid('lending_institution')) {
      return false;
    }
    if (!this._checkFormFieldIsValid('mailing_address')) {
      return false;
    }
    if (!this._checkFormFieldIsValid('city')) {
      return false;
    }
    if (!this._checkFormFieldIsValid('state')) {
      return false;
    }
    if (!this._checkFormFieldIsValid('zip')) {
      return false;
    }
    if (!this._checkFormFieldIsValid('loan_amount')) {
      return false;
    }
    if (!this._checkFormFieldIsValid('loan_intrest_rate')) {
      return false;
    }
    if (!this._checkFormFieldIsValid('loan_incurred_date')) {
      return false;
    }
    if (!this._checkFormFieldIsValid('loan_due_date')) {
      return false;
    }
    return true;
  }

  private _checkSectionAValid(): boolean {
    if (!this._checkFormFieldIsValid('is_loan_restructured')) {
      return false;
    }
    return true;
  }

  private _checkSectionBValid(): boolean {
    if (!this._checkFormFieldIsValid('credit_amount_this_draw')) {
      return false;
    }
    return true;
  }

  private _checkSectionCValid(): boolean {
    if (!this._checkFormFieldIsValid('other_parties_liable')) {
      return false;
    }
    return true;
  }

  private _checkSectionDValid(): boolean {
    if (!this._checkFormFieldIsValid('pledged_collateral_ind')) {
      return false;
    }
    return true;
  }

  private _checkSectionEValid(): boolean {
    if (!this._checkFormFieldIsValid('future_income_ind')) {
      return false;
    }
    return true;
  }

  private _checkSectionFValid(): boolean {
    if (!this._checkFormFieldIsValid('basis_of_loan_desc')) {
      return false;
    }
    return true;
  }

  private _checkSectionGValid(): boolean {
    if (!this._checkFormFieldIsValid('treasurer_last_name')) {
      return false;
    }
    if (!this._checkFormFieldIsValid('treasurer_first_name')) {
      return false;
    }
    if (!this._checkFormFieldIsValid('treasurer_middle_name')) {
      return false;
    }
    if (!this._checkFormFieldIsValid('treasurer_prefix')) {
      return false;
    }
    if (!this._checkFormFieldIsValid('treasurer_suffix')) {
      return false;
    }
    if (!this._checkFormFieldIsValid('treasurer_signed_date')) {
      return false;
    }
    return true;
  }

  private _checkSectionHValid(): boolean {
    if (!this._checkFormFieldIsValid('file_upload')) {
      return false;
    }
    return true;
  }

  private _checkSectionIValid(): boolean {
    if (!this._checkFormFieldIsValid('final_authorization')) {
      return false;
    }
    return true;
  }

  /**
   * Returns true if the field is valid.
   * @param fieldName name of control to check for validity
   */
  private _checkFormFieldIsValid(fieldName: string): boolean {
    if (this.c1Form.contains(fieldName)) {
      return this.c1Form.get(fieldName).valid;
    }
  }

  private _getStates() {
    this._contactsService.getStates().subscribe(res => {
      this.states = res;
    });
  }

  private _setFormGroup() {
    const alphaNumericFn = alphaNumeric();

    this.c1Form = this._fb.group({
      lending_institution: new FormControl(null, [Validators.required, Validators.maxLength(100)]),
      mailing_address: new FormControl(null, [Validators.required, Validators.maxLength(100)]),
      city: new FormControl(null, [Validators.required, Validators.maxLength(100), alphaNumericFn]),
      state: new FormControl(null, [Validators.required, Validators.maxLength(2)]),
      zip: new FormControl(null, [Validators.required, Validators.maxLength(10), alphaNumericFn]),
      loan_amount: new FormControl(null, [Validators.required, Validators.maxLength(12)]),
      loan_intrest_rate: new FormControl(null, [Validators.required, Validators.maxLength(2)]),
      loan_incurred_date: new FormControl(null, [Validators.required]),
      loan_due_date: new FormControl(null, [Validators.required]),
      is_loan_restructured: new FormControl(null, [Validators.required]),
      credit_amount_this_draw: new FormControl(null, [Validators.required, Validators.maxLength(12)]),
      total_outstanding_balance: new FormControl(null),
      other_parties_liable: new FormControl(null, [Validators.required]),
      pledged_collateral_ind: new FormControl(null, [Validators.required]),
      future_income_ind: new FormControl(null, [Validators.required]),
      basis_of_loan_desc: new FormControl(null, [Validators.required, Validators.maxLength(100)]),
      treasurer_last_name: new FormControl(null, [Validators.required, Validators.maxLength(30), alphaNumericFn]),
      treasurer_first_name: new FormControl(null, [Validators.required, Validators.maxLength(20), alphaNumericFn]),
      treasurer_middle_name: new FormControl(null, [Validators.maxLength(20), alphaNumericFn]),
      treasurer_prefix: new FormControl(null, [Validators.maxLength(10), alphaNumericFn]),
      treasurer_suffix: new FormControl(null, [Validators.maxLength(10), alphaNumericFn]),
      treasurer_signed_date: new FormControl(null, [Validators.required]),
      file_upload: new FormControl(null, [Validators.required]),
      final_authorization: new FormControl(null, [Validators.requiredTrue])
    });

    // No validation for dev ONLY!!
    // this.c1Form = this._fb.group({
    //   lending_institution: new FormControl(null),
    //   mailing_address: new FormControl(null),
    //   city: new FormControl(null),
    //   state: new FormControl(null),
    //   zip: new FormControl(null),
    //   loan_amount: new FormControl(null),
    //   loan_intrest_rate: new FormControl(null),
    //   loan_incurred_date: new FormControl(null),
    //   loan_due_date: new FormControl(null),
    //   is_loan_restructured: new FormControl(null),
    //   credit_amount_this_draw: new FormControl(null),
    //   total_outstanding_balance: new FormControl(null),
    //   other_parties_liable: new FormControl(null),
    //   pledged_collateral_ind: new FormControl(null),
    //   future_income_ind: new FormControl(null),
    //   basis_of_loan_desc: new FormControl(null),
    //   treasurer_last_name: new FormControl(null),
    //   treasurer_first_name: new FormControl(null),
    //   treasurer_middle_name: new FormControl(null),
    //   treasurer_prefix: new FormControl(null),
    //   treasurer_suffix: new FormControl(null),
    //   treasurer_signed_date: new FormControl(null),
    //   file_upload: new FormControl(null),
    //   final_authorization: new FormControl(null)
    // });
  }

  public print() {
    alert('Print not yet implemented');
  }

  public finish() {
    if (this._checkSectionIValid()) {
      alert('Finish not yet implemented');

      if (this.c1Form.valid) {
        const formData = {};
        this._prepareFormDataForApi(formData);
        this._schedC1Service.saveScheduleC1(this.formType, this.scheduleAction, formData).subscribe(res => {
          console.log();
        });
      } else {
        console.log('Errors exist on previous screens.');
      }
    } else {
      this.c1Form.markAsTouched();
    }
  }

  private _prepareFormDataForApi(formData: any) {
    for (const field in this.c1Form.controls) {
      if (field === 'loan_amount' || field === 'credit_amount_this_draw') {
        let amount = this.c1Form.get(field).value;
        amount = amount.replace(/,/g, ``);
        formData[field] = amount;
      } else if (field === 'file_upload') {
        const file = this.c1Form.get(field).value;
        // formData[field] = file.blob????
      } else if (field === 'loan_incurred_date' || field === 'loan_due_date') {
        formData[field] = this._utilService.formatDate(this.c1Form.get(field).value);
      } else if (field === 'is_loan_restructured') {
      } else if (field === '') {
      } else if (field === '') {
      } else {
        if (this.c1Form.contains(field)) {
          formData[field] = this.c1Form.get(field).value;
        }
      }
    }
  }

  public uploadFile() {
    // TODO add file to form
    // Is this neeed or can it be added to form from the html template
  }

  private _clearFormValues() {
    this.c1Form.reset();
  }

  // type ahead start
  // type ahead start
  // type ahead start

  /**
   *
   * @param $event
   */
  public handleSelectedIndividual($event: NgbTypeaheadSelectItemEvent) {
    // TODO set entity id? in formGroup
    const entity = $event.item;
    this.c1Form.patchValue({ treasurer_last_name: entity.last_name }, { onlySelf: true });
    this.c1Form.patchValue({ treasurer_first_name: entity.first_name }, { onlySelf: true });
    this.c1Form.patchValue({ treasurer_middle_name: entity.middle_name }, { onlySelf: true });
    this.c1Form.patchValue({ treasurer_prefix: entity.prefix }, { onlySelf: true });
    this.c1Form.patchValue({ treasurer_suffix: entity.suffix }, { onlySelf: true });
  }

  /**
   * Format an entity to display in the type ahead.
   *
   * @param result formatted item in the typeahead list
   */
  public formatTypeaheadItem(result: any) {
    const lastName = result.last_name ? result.last_name.trim() : '';
    const firstName = result.first_name ? result.first_name.trim() : '';
    const street1 = result.street_1 ? result.street_1.trim() : '';
    const street2 = result.street_2 ? result.street_2.trim() : '';

    return `${lastName}, ${firstName}, ${street1}, ${street2}`;
  }

  /**
   * Search for entities/contacts when last name input value changes.
   */
  searchLastName = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      switchMap(searchText => {
        if (searchText) {
          return this._typeaheadService.getContacts(searchText, 'last_name');
        } else {
          return Observable.of([]);
        }
      })
    );

  /**
   * Search for entities/contacts when first name input value changes.
   */
  searchFirstName = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      switchMap(searchText => {
        if (searchText) {
          return this._typeaheadService.getContacts(searchText, 'first_name');
        } else {
          return Observable.of([]);
        }
      })
    );

  /**
   * format the value to display in the input field once selected from the typeahead.
   *
   * For some reason this gets called for all typeahead fields despite the binding in the
   * template to the last name field.  In these cases return x to retain the value in the
   * input for the other typeahead fields.
   */
  formatterLastName = (x: { last_name: string }) => {
    if (typeof x !== 'string') {
      return x.last_name;
    } else {
      return x;
    }
  };

  /**
   * format the value to display in the input field once selected from the typeahead.
   *
   * For some reason this gets called for all typeahead fields despite the binding in the
   * template to the first name field.  In these cases return x to retain the value in the
   * input for the other typeahead fields.
   */
  formatterFirstName = (x: { first_name: string }) => {
    if (typeof x !== 'string') {
      return x.first_name;
    } else {
      return x;
    }
  };

  // type ahead end
  // type ahead end
  // type ahead end

  public setFile(e: any): void {
    if (e.target.files[0]) {
      this.c1Form.patchValue({ file_upload: e.target.files[0] }, { onlySelf: true });
    }
  }

  public handleOnBlurEvent($event: any, fieldName: string) {
    this._formatAmount($event, fieldName, false);
  }

  // These 2 methods are duplicated from AbstractSchedule and should be made as shared utility
  // methods.

  private _formatAmount(e: any, fieldName: string, negativeAmount: boolean) {
    let contributionAmount: string = e.target.value;

    // default to 0 when no value
    contributionAmount = contributionAmount ? contributionAmount : '0';

    // remove commas
    contributionAmount = contributionAmount.replace(/,/g, ``);

    // determine if negative, truncate if > max
    contributionAmount = this._transformAmount(contributionAmount, this._contributionAmountMax);

    let contributionAmountNum = parseFloat(contributionAmount);
    // Amount is converted to negative for Return / Void / Bounced
    if (negativeAmount) {
      contributionAmountNum = -Math.abs(contributionAmountNum);
      // this._contributionAmount = String(contributionAmountNum);
    }

    const amountValue: string = this._decimalPipe.transform(contributionAmountNum, '.2-2');
    const patch = {};
    patch[fieldName] = amountValue;
    this.c1Form.patchValue(patch, { onlySelf: true });
  }

  /**
   * Allow for negative sign and don't allow more than the max
   * number of digits.
   */
  private _transformAmount(amount: string, max: number): string {
    if (!amount) {
      return amount;
    } else if (amount.length > 0 && amount.length <= max) {
      return amount;
    } else {
      // Need to handle negative sign, decimal and max digits
      if (amount.substring(0, 1) === '-') {
        if (amount.length === max || amount.length === max + 1) {
          return amount;
        } else {
          return amount.substring(0, max + 2);
        }
      } else {
        const result = amount.substring(0, max + 1);
        return result;
      }
    }
  }
}
