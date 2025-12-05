package billing

import (
	"context"
	"log"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type PostgresBillingRepo struct {
	db *pgxpool.Pool
}

func NewPostgresBillingRepo(db *pgxpool.Pool) *PostgresBillingRepo {
	return &PostgresBillingRepo{db: db}
}

func startOfLastWeek() time.Time {
	now := time.Now()

	// Monday = 1 … Sunday = 7
	wd := int(now.Weekday())
	if wd == 0 { // Go treats Sunday as 0
		wd = 7
	}

	// start of this week (Monday 00:00)
	startOfThisWeek := time.Date(
		now.Year(), now.Month(), now.Day()-(wd-1),
		0, 0, 0, 0, now.Location(),
	)

	// last week's Monday
	return startOfThisWeek.AddDate(0, 0, -7)
}

// Fetch all uncharged sessions with their rates, grouped by client.
func (r *PostgresBillingRepo) GetUnchargedSessions(ctx context.Context) (map[int64][]Session, error) {

	cutoff := startOfLastWeek()

	rows, err := r.db.Query(ctx, `
		SELECT
			ts.id,
			s.client_id,
			ts.student_id,
			ts.tutor_id,
			tu.first_name || ' ' || tu.last_name AS tutor_name,
			ts.start_time,
			ts.duration_minutes,
			COALESCE(r.student_rate, 0.0),
			COALESCE(r.tutor_pay_rate, 0.0)
		FROM tutoring_sessions ts
		INNER JOIN accounts_student s 
			ON ts.student_id = s.id 
		LEFT JOIN tutoring_sessions_rate r 
			ON r.student_id = ts.student_id
			AND r.tutor_id = ts.tutor_id
		LEFT JOIN accounts_user tu
			ON tu.id = ts.tutor_id
		WHERE ts.student_charged = FALSE
		AND ts.start_time < $1
		ORDER BY s.client_id, ts.start_time;
	`, cutoff)

	if err != nil {
		return nil, err
	}
	defer rows.Close()

	grouped := make(map[int64][]Session)

	for rows.Next() {
		var sess Session

		err := rows.Scan(
			&sess.ID,
			&sess.ClientID,
			&sess.StudentID,
			&sess.TutorID,
			&sess.TutorName,
			&sess.StartTime,
			&sess.DurationMin,
			&sess.StudentRate,
			&sess.TutorRate,
		)
		if err != nil {
			log.Println("scan error:", err)
			return nil, err
		}

		grouped[sess.ClientID] = append(grouped[sess.ClientID], sess)
	}

	return grouped, nil
}

// Mark a session as charged.
func (r *PostgresBillingRepo) MarkSessionCharged(ctx context.Context, sessionID int64) error {
	_, err := r.db.Exec(ctx, `
        UPDATE tutoring_sessions
        SET student_charged = TRUE
        WHERE id = $1;
    `, sessionID)
	return err
}
