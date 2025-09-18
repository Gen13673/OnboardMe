import { Section } from "./Section";
import { User } from "./User";
import { Enrollment } from "./Enrollment";

export interface Course {
     id: number;
     title: string;
     description: string;
     area: string;
     createdDate: Date;
     expiryDate: Date;
     createdBy: User;
     enrollments: Array<Enrollment>;
     sections: Array<Section>;
}