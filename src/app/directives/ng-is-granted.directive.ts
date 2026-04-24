import { Directive, Input, OnDestroy, TemplateRef, ViewContainerRef } from "@angular/core";
import { BehaviorSubject, Observable, Subject, takeUntil } from "rxjs";
import { UserService } from "../services/user.service";

@Directive({
    selector: '[ngIsGranted]',
    standalone: false
})
export class NgIsGrantedDirective implements OnDestroy {
    private destroy$ = new Subject<void>();
    private hasView = false;

    constructor(
        private templateRef: TemplateRef<any>,
        private viewContainer: ViewContainerRef,
        private userService: UserService,
    ) { }

    isGrantedRole(role: string[]): Observable<boolean> {
        const accessChecker = new BehaviorSubject(false);
        const accessChecker$ = accessChecker.asObservable();
        this.userService.getUserRoles().then((roleSystem) => {
            const hasIntersection = role.some((r) => roleSystem.includes(r));
            accessChecker.next(hasIntersection);
        }).catch(() => {
            accessChecker.next(false);
        });
        return accessChecker$;
    }

    @Input() set ngIsGranted(roles: string[]) {
        this.isGrantedRole(roles)
            .pipe(
                takeUntil(this.destroy$),
            )
            .subscribe((can: boolean) => {
                if (can && !this.hasView) {
                    this.viewContainer.createEmbeddedView(this.templateRef);
                    this.hasView = true;
                } else if (!can && this.hasView) {
                    this.viewContainer.clear();
                    this.hasView = false;
                }
            });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}