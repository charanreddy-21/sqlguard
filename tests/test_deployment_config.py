import asyncio
import unittest

from backend.main import app, get_cors_origins


class CorsConfigurationTests(unittest.TestCase):
    def test_defaults_allow_local_vite_origins(self):
        self.assertEqual(
            get_cors_origins(""),
            ["http://localhost:5173", "http://127.0.0.1:5173"],
        )

    def test_reads_comma_separated_exact_origins(self):
        self.assertEqual(
            get_cors_origins(" https://sqlguard.example,https://preview.example "),
            ["https://sqlguard.example", "https://preview.example"],
        )

    def test_rejects_wildcard_origin(self):
        with self.assertRaisesRegex(ValueError, "exact origins"):
            get_cors_origins("https://sqlguard.example, *")

    def test_app_cors_middleware_has_expected_defaults(self):
        cors = next(middleware for middleware in app.user_middleware if middleware.cls.__name__ == "CORSMiddleware")
        self.assertEqual(cors.kwargs["allow_origins"], get_cors_origins(""))
        self.assertEqual(cors.kwargs["allow_methods"], ["GET", "POST"])
        self.assertEqual(cors.kwargs["allow_headers"], ["Accept", "Content-Type"])

    def test_configured_cors_middleware_answers_local_preflight(self):
        configuration = next(
            middleware for middleware in app.user_middleware if middleware.cls.__name__ == "CORSMiddleware"
        )
        responses = []

        async def downstream(scope, receive, send):
            await send({"type": "http.response.start", "status": 200, "headers": []})
            await send({"type": "http.response.body", "body": b""})

        async def receive():
            return {"type": "http.request", "body": b"", "more_body": False}

        async def send(message):
            responses.append(message)

        middleware = configuration.cls(downstream, *configuration.args, **configuration.kwargs)
        scope = {
            "type": "http",
            "method": "OPTIONS",
            "path": "/predict",
            "headers": [
                (b"origin", b"http://localhost:5173"),
                (b"access-control-request-method", b"POST"),
                (b"access-control-request-headers", b"content-type"),
            ],
        }
        asyncio.run(middleware(scope, receive, send))

        headers = dict(responses[0]["headers"])
        self.assertEqual(responses[0]["status"], 200)
        self.assertEqual(headers[b"access-control-allow-origin"], b"http://localhost:5173")
        self.assertIn(b"POST", headers[b"access-control-allow-methods"])
        self.assertIn(b"content-type", headers[b"access-control-allow-headers"].lower())


if __name__ == "__main__":
    unittest.main()
