export interface Enrollment {
    idCourse: number;
    idUser: number;
    enrolledAt: Date;
    finishedDate: Date;
    status: string;
    favorite: boolean;
    idSection: number;
}