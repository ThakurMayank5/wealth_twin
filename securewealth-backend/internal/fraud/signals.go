package fraud

const (
	ScoreUntrustedDevice = 25
	ScoreFastAction      = 20
	ScoreAmountUnusual   = 25
	ScoreOTPRetries      = 20
	ScoreNewFundType     = 15
	ScoreCancelRetry     = 15
)

type Signal struct {
	Name    string `json:"name"`
	Score   int    `json:"score"`
	Message string `json:"message"`
}
