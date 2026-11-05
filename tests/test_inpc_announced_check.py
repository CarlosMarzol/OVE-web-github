import importlib.util
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "inpc_announced_check.py"
SPEC = importlib.util.spec_from_file_location("inpc_announced_check", SCRIPT)
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class AnnouncedINPCTest(unittest.TestCase):
    def test_parse_monthly_and_cumulative_rates_from_bcv_text(self):
        parsed = MODULE.parse_announced(
            "Índice Nacional de Precios al Consumidor Octubre - 2026 "
            "Var %: 6,2 Var Acumulada %: 245,5 Indice: 733.714.624.268.083"
        )
        self.assertEqual(parsed["period"], "2026-10")
        self.assertEqual(parsed["var_mensual_pct"], 6.2)
        self.assertEqual(parsed["var_acumulada_pct"], 245.5)
        self.assertEqual(parsed["indice"], 733714624268083.0)

    def test_note_marks_new_announcement_pending_and_is_idempotent(self):
        announced = {
            "period": "2026-10", "period_label": "Octubre 2026",
            "var_mensual_pct": 6.2, "var_acumulada_pct": 245.5, "indice": 733714624268083.0,
        }
        series = {"latest_period": "2026-08", "latest_date": "2026-08-01", "latest_value": 8.9}
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "note.json"
            with patch.object(MODULE, "OUT_PATH", path):
                MODULE.write_note(announced, series)
                payload = json.loads(path.read_text(encoding="utf-8"))
                self.assertTrue(payload["mostrar_nota"])
                self.assertEqual(payload["metadata"]["status"], "anuncio_pendiente_de_confirmacion_estadistica")
                before = path.read_bytes()
                MODULE.write_note(announced, series)
                self.assertEqual(path.read_bytes(), before)


if __name__ == "__main__":
    unittest.main()
