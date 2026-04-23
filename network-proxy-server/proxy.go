package main

import (
	"io"
	"log"
	"net"
)

const (
	listenAddr = "0.0.0.0:42069"
	targetAddr = "127.0.0.1:42070"
)

func main() {
	listener, err := net.Listen("tcp", listenAddr)
	if err != nil {
		log.Fatalf("Failed to listen on %s: %v", listenAddr, err)
	}
	defer listener.Close()

	log.Printf("Proxy listening on %s → forwarding to %s", listenAddr, targetAddr)

	for {
		clientConn, err := listener.Accept()
		if err != nil {
			log.Printf("Failed to accept connection: %v", err)
			continue
		}
		log.Printf("New connection from %s", clientConn.RemoteAddr())
		go handleConnection(clientConn)
	}
}

func handleConnection(clientConn net.Conn) {
	defer clientConn.Close()

	targetConn, err := net.Dial("tcp", targetAddr)
	if err != nil {
		log.Printf("Failed to connect to target %s: %v", targetAddr, err)
		return
	}
	defer targetConn.Close()

	log.Printf("Tunneling %s ↔ %s", clientConn.RemoteAddr(), targetAddr)

	done := make(chan struct{}, 2)

	// Client → Target
	go func() {
		n, err := io.Copy(targetConn, clientConn)
		if err != nil {
			log.Printf("Client→Target copy error: %v", err)
		}
		log.Printf("Client→Target: %d bytes from %s", n, clientConn.RemoteAddr())
		targetConn.(*net.TCPConn).CloseWrite()
		done <- struct{}{}
	}()

	// Target → Client
	go func() {
		n, err := io.Copy(clientConn, targetConn)
		if err != nil {
			log.Printf("Target→Client copy error: %v", err)
		}
		log.Printf("Target→Client: %d bytes to %s", n, clientConn.RemoteAddr())
		clientConn.(*net.TCPConn).CloseWrite()
		done <- struct{}{}
	}()

	<-done
	<-done
	log.Printf("Connection closed: %s", clientConn.RemoteAddr())
}