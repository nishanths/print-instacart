package main

import (
	"flag"
	"io"
	"io/ioutil"
	"log"
	"net/http"
)

func main() {
	httpAddr := flag.String("http", "localhost:8091", "http service address")
	flag.Parse()

	p := proxy{AllowOrigin: "https://www.instacart.com"}
	http.Handle("/ic-proxy", &p)

	log.Printf("listening on %s", *httpAddr)
	log.Fatal(http.ListenAndServe(*httpAddr, nil))
}

type proxy struct {
	AllowOrigin string
}

func (p *proxy) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	u := r.FormValue("url")
	if u == "" {
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte("usage: /ic-proxy?url=<url>\n"))
		return
	}

	rsp, err := http.Get(u)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	defer rsp.Body.Close()

	// copy the response.
	// we don't copy headers except for Content-Type.
	if c := rsp.Header.Get("Content-Type"); c != "" {
		w.Header().Set("Content-Type", c)
	}
	w.Header().Set("Access-Control-Allow-Origin", p.AllowOrigin)
	w.WriteHeader(rsp.StatusCode)
	io.Copy(w, rsp.Body)

	io.Copy(ioutil.Discard, rsp.Body) // discard unread bytes, in case the client disconnected
}
