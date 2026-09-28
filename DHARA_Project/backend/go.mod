module github.com/dharact/backend

go 1.22

require (
	github.com/go-chi/chi/v5 v5.0.12
	github.com/golang-jwt/jwt/v5 v5.2.1
	github.com/lib/pq v1.10.9
	golang.org/x/crypto v0.24.0
	golang.org/x/time v0.5.0
)

// golang.org/x/* modules are fetched via their GitHub mirrors because this
// build environment cannot reach golang.org's go-import redirect endpoint.
// Safe to remove these replace directives in a normal network environment.
replace golang.org/x/crypto => github.com/golang/crypto v0.24.0

replace golang.org/x/time => github.com/golang/time v0.5.0
