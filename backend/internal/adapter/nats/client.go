package natsadapter

import (
	"context"
	"log/slog"
	"time"

	"github.com/nats-io/nats.go"
	"github.com/nats-io/nats.go/jetstream"
	"vct-platform/backend/internal/apierror"
)

// Client wraps the NATS JetStream connection.
type Client struct {
	conn *nats.Conn
	js   jetstream.JetStream
	log  *slog.Logger
}

// NewClient establishes a NATS connection and prepares JetStream.
func NewClient(ctx context.Context, natsURL string, log *slog.Logger) (*Client, error) {
	if natsURL == "" {
		natsURL = nats.DefaultURL
	}

	nc, err := nats.Connect(natsURL, nats.RetryOnFailedConnect(true), nats.MaxReconnects(-1), nats.ReconnectWait(2*time.Second))
	if err != nil {
		return nil, apierror.Wrap(err, "NATS_CONNECT_FAIL", "Không thể kết nối nats server")
	}

	js, err := jetstream.New(nc)
	if err != nil {
		nc.Close()
		return nil, apierror.Wrap(err, "NATS_JS_FAIL", "Không thể khởi tạo jetstream")
	}

	return &Client{
		conn: nc,
		js:   js,
		log:  log.With(slog.String("component", "nats")),
	}, nil
}

// Close closes the underlying NATS connection gracefully.
func (c *Client) Close() {
	if c.conn != nil {
		c.conn.Close()
	}
}

// JetStream provides access to the underlying JetStream context.
func (c *Client) JetStream() jetstream.JetStream {
	return c.js
}
