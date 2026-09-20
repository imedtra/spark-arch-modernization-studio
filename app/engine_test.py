"""Unit tests for the SPARK Architecture Modernization Rapid Insights Engine."""

import importlib.machinery
import importlib.util
import os
import unittest


def _load_app_module():
    app_path = os.path.join(os.path.dirname(__file__), "app.py")
    loader = importlib.machinery.SourceFileLoader("studio_app", app_path)
    spec = importlib.util.spec_from_loader(loader.name, loader)
    mod = importlib.util.module_from_spec(spec)
    loader.exec_module(mod)
    return mod


app_mod = _load_app_module()


class EngineTest(unittest.TestCase):

    def test_enterprise_reference_estate_parity(self):
        res = app_mod.compute_assessment("enterprise-reference-estate")
        self.assertEqual(res["estate"]["id"], "enterprise-reference-estate")
        self.assertEqual(res["summary_metrics"]["total_servers"], 538)
        self.assertEqual(res["summary_metrics"]["total_applications"], 110)
        self.assertIsNotNone(res["estate_overview"])
        self.assertEqual(len(res["database_modernization"]), 5)
        self.assertEqual(len(res["technology_domains"]["domains"]), 5)
        self.assertIsNotNone(res["migration_scenarios"])
        s2_savings = res["migration_scenarios"]["scenario_2_modernize"]["annual_savings_usd"]
        self.assertGreater(s2_savings, 2000000)

    def test_cost_config_overrides_update_scenarios(self):
        cud_res = app_mod.compute_assessment(
            "enterprise-reference-estate",
            cost_config={
                "region": "me-central1 (Doha, Qatar)",
                "prod_payment": "3_year_cud",
                "nonprod_hours": 175,
                "byol_windows_sql": True,
            },
        )
        payg_res = app_mod.compute_assessment(
            "enterprise-reference-estate",
            cost_config={
                "region": "me-central1 (Doha, Qatar)",
                "prod_payment": "payg",
                "nonprod_hours": 730,
                "byol_windows_sql": False,
            },
        )
        self.assertGreater(
            cud_res["migration_scenarios"]["scenario_2_modernize"]["annual_savings_usd"],
            payg_res["migration_scenarios"]["scenario_2_modernize"]["annual_savings_usd"],
        )

    def test_waf_remediation_increases_score_to_100(self):
        baseline = app_mod.compute_assessment("enterprise-reference-estate")
        remediated = app_mod.compute_assessment(
            "enterprise-reference-estate",
            remediated_controls=["waf-sec-1", "waf-rel-1", "waf-cost-1"],
        )
        self.assertGreater(
            remediated["waf_audit"]["overall_score_pct"],
            baseline["waf_audit"]["overall_score_pct"],
        )
        self.assertEqual(remediated["waf_audit"]["overall_score_pct"], 100)

    def test_ai_advisor_grounded_responses(self):
        byol_ans = app_mod.answer_ai_advisor_query("enterprise-reference-estate", "microsoft sql server byol licensing")
        self.assertIn("Software Assurance", byol_ans["answer"])
        gcve_ans = app_mod.answer_ai_advisor_query("enterprise-reference-estate", "why gcve and gce shared vpc")
        self.assertIn("100 Gbps", gcve_ans["answer"])

    def test_terraform_and_markdown_export(self):
        assessment = app_mod.compute_assessment("enterprise-reference-estate")
        tf = app_mod.generate_terraform_blueprint(assessment)
        md = app_mod.generate_markdown_report(assessment)
        self.assertIn('resource "google_compute_network"', tf)
        self.assertIn("# Rapid Insights Assessment Report:", md)

    def test_customer_rvtools_csv_ingestion(self):
        estate_id = app_mod.parse_and_ingest_customer_telemetry(
            client_name="Qatar National Energy",
            industry="Energy & Utilities",
            region="me-central1 (Doha, Qatar)",
            csv_text=app_mod.SAMPLE_RVTOOLS_CSV,
        )
        res = app_mod.compute_assessment(estate_id)
        self.assertEqual(res["summary_metrics"]["total_servers"], 50)
        self.assertEqual(res["summary_metrics"]["total_applications"], 12)
        self.assertGreaterEqual(res["estate_overview"]["utilization_summary"]["zombie_servers_under_5_count"], 3)
        self.assertGreater(res["migration_scenarios"]["scenario_2_modernize"]["annual_savings_usd"], 0)


if __name__ == "__main__":
    unittest.main()
