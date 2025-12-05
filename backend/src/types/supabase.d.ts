export type Database = {
    public: {
        Tables: {
            users: {
                Row: {
                    id: string;
                    name: string;
                    email: string;
                    hashed_password: string;
                    role: 'user' | 'admin';
                    employee_number: string;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    name: string;
                    email: string;
                    hashed_password: string;
                    role?: 'user' | 'admin';
                    employee_number: string;
                };
                Update: Partial<{
                    name: string;
                    email: string;
                    hashed_password: string;
                    role: 'user' | 'admin';
                    employee_number: string;
                }>;
                Relationships: [];
            };
            attendance_records: {
                Row: {
                    id: string;
                    user_id: string;
                    date: string;
                    created_at: string;
                };
                Insert: {
                    user_id: string;
                    date: string;
                };
                Update: Partial<{
                    user_id: string;
                    date: string;
                }>;
                Relationships: [
                    {
                        foreignKeyName: 'attendance_records_user_id_fkey';
                        columns: ['user_id'];
                        referencedRelation: 'users';
                        referencedColumns: ['id'];
                    }
                ];
            };
            work_sessions: {
                Row: {
                    id: string;
                    attendance_id: string;
                    clock_in: string;
                    clock_out: string | null;
                    created_at: string;
                };
                Insert: {
                    attendance_id: string;
                    clock_in: string;
                    clock_out?: string | null;
                };
                Update: Partial<{
                    attendance_id: string;
                    clock_in: string;
                    clock_out: string | null;
                }>;
                Relationships: [
                    {
                        foreignKeyName: 'work_sessions_attendance_id_fkey';
                        columns: ['attendance_id'];
                        referencedRelation: 'attendance_records';
                        referencedColumns: ['id'];
                    }
                ];
            };
            breaks: {
                Row: {
                    id: string;
                    session_id: string;
                    break_start: string;
                    break_end: string | null;
                    created_at: string;
                };
                Insert: {
                    session_id: string;
                    break_start: string;
                    break_end?: string | null;
                };
                Update: Partial<{
                    session_id: string;
                    break_start: string;
                    break_end: string | null;
                }>;
                Relationships: [
                    {
                        foreignKeyName: 'breaks_session_id_fkey';
                        columns: ['session_id'];
                        referencedRelation: 'work_sessions';
                        referencedColumns: ['id'];
                    }
                ];
            };
        };
        Views: object;
        Functions: object;
        Enums: object;
        CompositeTypes: object;
    };
};