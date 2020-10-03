import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';

import { AccountService, AlertService } from '@app/_services';

@Component({ templateUrl: 'add-edit.component.html' })
export class AddEditComponent implements OnInit {
    form: FormGroup;
    id: string;
    isAddMode: boolean;
    loading = false;
    submitted = false;

    constructor(
        private formBuilder: FormBuilder,
        private route: ActivatedRoute,
        private router: Router,
        private accountService: AccountService,
        private alertService: AlertService
    ) {}

    // tslint:disable-next-line: typedef
    ngOnInit() {
        // tslint:disable-next-line: no-string-literal
        this.id = this.route.snapshot.params['id'];
        this.isAddMode = !this.id;

        // password not required in edit mode
        const passwordValidators = [Validators.minLength(6)];
        if (this.isAddMode) {
            passwordValidators.push(Validators.required);
        }

        this.form = this.formBuilder.group({
            firstName: ['', Validators.required],
            lastName: ['', Validators.required],
            username: ['', Validators.required],
            password: ['', passwordValidators]
        });

        if (!this.isAddMode) {
            this.accountService.getById(this.id)
                .pipe(first())
                .subscribe(x => this.form.patchValue(x));
        }
    }

     // convenience getter for easy access to form fields
     // tslint:disable-next-line: typedef
     get f() { return this.form.controls; }

     // tslint:disable-next-line: typedef
     onSubmit() {
         this.submitted = true;

         // reset alerts on submit
         this.alertService.clear();

         // stop here if form is invalid
         if (this.form.invalid) {
             return;
         }

         this.loading = true;
         if (this.isAddMode) {
             this.createUser();
         } else {
             this.updateUser();
         }
     }

     // tslint:disable-next-line: typedef
     private createUser() {
         this.accountService.register(this.form.value)
             .pipe(first())
             .subscribe({
                 next: () => {
                     this.alertService.success('User added successfully', { keepAfterRouteChange: true });
                     this.router.navigate(['../'], { relativeTo: this.route });
                 },
                 error: error => {
                     this.alertService.error(error);
                     this.loading = false;
                 }
             });
     }

     // tslint:disable-next-line: typedef
     private updateUser() {
         this.accountService.update(this.id, this.form.value)
             .pipe(first())
             .subscribe({
                 next: () => {
                     this.alertService.success('Update successful', { keepAfterRouteChange: true });
                     this.router.navigate(['../../'], { relativeTo: this.route });
                 },
                 error: error => {
                     this.alertService.error(error);
                     this.loading = false;
                 }
             });
     }
 }
