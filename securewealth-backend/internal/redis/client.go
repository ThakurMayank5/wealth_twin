package redis

import (
	"context"
	"encoding/json"
	"time"

	goredis "github.com/redis/go-redis/v9"
)

type Client struct {
	rdb *goredis.Client
}

func New(redisURL string) (*Client, error) {
	opt, err := goredis.ParseURL(redisURL)
	if err != nil {
		return nil, err
	}
	client := goredis.NewClient(opt)
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()
	if err := client.Ping(ctx).Err(); err != nil {
		return nil, err
	}
	return &Client{rdb: client}, nil
}

func (c *Client) Close() error {
	return c.rdb.Close()
}

func (c *Client) Raw() *goredis.Client {
	return c.rdb
}

func (c *Client) Set(ctx context.Context, key, value string, ttl time.Duration) {
	_ = c.rdb.Set(ctx, key, value, ttl).Err()
}

func (c *Client) Get(ctx context.Context, key string) string {
	v, err := c.rdb.Get(ctx, key).Result()
	if err != nil {
		return ""
	}
	return v
}

func (c *Client) GetJSON(ctx context.Context, key string, dest any) error {
	v, err := c.rdb.Get(ctx, key).Result()
	if err != nil {
		return err
	}
	return json.Unmarshal([]byte(v), dest)
}

func (c *Client) SetJSON(ctx context.Context, key string, value any, ttl time.Duration) error {
	raw, err := json.Marshal(value)
	if err != nil {
		return err
	}
	return c.rdb.Set(ctx, key, raw, ttl).Err()
}

func (c *Client) Incr(ctx context.Context, key string) int64 {
	v, err := c.rdb.Incr(ctx, key).Result()
	if err != nil {
		return 0
	}
	return v
}

func (c *Client) Expire(ctx context.Context, key string, ttl time.Duration) {
	_ = c.rdb.Expire(ctx, key, ttl).Err()
}

func (c *Client) Del(ctx context.Context, key string) {
	_ = c.rdb.Del(ctx, key).Err()
}

func (c *Client) Exists(ctx context.Context, key string) bool {
	count, err := c.rdb.Exists(ctx, key).Result()
	if err != nil {
		return false
	}
	return count > 0
}
