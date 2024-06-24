import { Injectable } from "@angular/core";
import { uniq as _uniq } from "lodash";
import { decrypt } from "../utils/util-encrypt";

@Injectable()
export class UserService {
    constructor() { }

    public getPersonaId(): Promise<number> {
        return new Promise((resolve, reject) => {
            const strcryptedId = localStorage.getItem('persona_id');
            const strId = decrypt(strcryptedId);
            if (strId) {
                resolve(parseInt(strId, 10));
            } else {
                reject(new Error('No id found'));
            }
        });
    }

    private decodeUser(): any {
        const strUser = localStorage.getItem("user");
        if (strUser === null || strUser === "") {
            throw new Error("No user information found");
        } else {
            try {
                const strdecoded = atob(strUser);
                const parsed = JSON.parse(strdecoded);
                if (parsed.user && parsed.userService) {
                    return parsed;
                } else {
                    throw new Error("Incomplete user information");
                }
            } catch (error) {
                throw new Error("Invalid user information: " + error);
            }
        }
    }

    public getUserRoles(): Promise<string[]> {
        return new Promise((resolve, reject) => {
            try {
                const { user, userService } = this.decodeUser();
                const roleUser = typeof user.role !== 'undefined' ? user.role as string[] : [];
                const roleUserService = typeof userService.role !== 'undefined' ? userService.role as string[] : [];
                const roles = _uniq(roleUser.concat(roleUserService)).filter((data: string) => !data.includes('/'));
                resolve(roles);
            } catch (error) {
                reject(error);
            }
        });
    }

    public getUserEmail(): Promise<string> {
        return new Promise((resolve, reject) => {
            try {
                const { user, userService } = this.decodeUser();
                if (user.email) {
                    resolve(user.email);
                } else if (userService.email) {
                    resolve(userService.email);
                } else {
                    reject(new Error("No email found"));
                }
            } catch (error) {
                reject(error);
            }
        });
    }

    public getUserDocument(compuesto: boolean = false): Promise<string> {
        return new Promise((resolve, reject) => {
            try {
                const { user, userService } = this.decodeUser();
                const documentToSearch = compuesto ? 'documento_compuesto' : 'documento';
                if (user[documentToSearch]) {
                    resolve(user[documentToSearch]);
                } else if (userService[documentToSearch]) {
                    resolve(userService[documentToSearch]);
                } else {
                    reject(new Error("No document found"));
                }
            } catch (error) {
                reject(error);
            }
        });
    }
}