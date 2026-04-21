package main

import (
	"crypto/tls"
	"fmt"
	"log"
	"net/http"

	"golang.org/x/net/http2"

	"github.com/gin-gonic/gin"
)

func main() {

	port := 42069

	cert := "cert.pem"
	key := "key.pem"

	tlsconfig := &tls.Config{
		MinVersion: tls.VersionTLS12,
	}

	router := gin.Default()

	router.GET("/ping", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "pong",
		})
	})

	// creating a custom server with TLS configuration

	server := &http.Server{
		Addr:      fmt.Sprintf(":%d", port),
		TLSConfig: tlsconfig,

		Handler: router,
	}

	// Enable HTTP/2
	http2.ConfigureServer(server, &http2.Server{})

	fmt.Printf("Starting server at Port %d\n", port)

	err := server.ListenAndServeTLS(cert, key)

	if err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}

}
