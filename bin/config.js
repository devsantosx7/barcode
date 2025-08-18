"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Config = void 0;
class Config {
}
exports.Config = Config;
Config.APP_NAME = 'Barcode to PC server';
Config.PORT = 57891;
Config.OAUTH_HTTP_PORT = Config.PORT + 1;
Config.AUTHOR = 'Filippo Tortomasi';
Config.DEFAULT_COMPONENT_TIMEOUT = 10000;
Config.WEBSITE_NAME = 'barcodetopc.com';
Config.URL_WEBSITE = 'https://barcodetopc.com';
Config.URL_PLAYSTORE = 'https://play.google.com/store/apps/details?id=com.barcodetopc';
Config.URL_APPSTORE = 'https://itunes.apple.com/app/id1180168368';
Config.URL_LICENSE_SERVER = 'https://license.barcodetopc.com/v5';
Config.URL_AI_ENDPOINT = 'https://license.barcodetopc.com';
Config.URL_TELEMETRY = Config.URL_LICENSE_SERVER + '/telemetry';
Config.URL_ORDER_CHECK = Config.URL_LICENSE_SERVER + '/order/check';
Config.URL_ORDER_DEACTIVATE = Config.URL_LICENSE_SERVER + '/order/remove';
Config.URL_PRICING = Config.URL_WEBSITE + '/pricing/';
Config.URL_V4 = Config.URL_WEBSITE + '/updates/v4/#why-upgrade-the-license';
Config.URL_V3 = Config.URL_WEBSITE + '/updates/v4/#v3';
Config.URL_DOWNLOAD_SERVER = Config.URL_WEBSITE + '/download';
Config.URL_WINDOWS_FIREWALL = Config.URL_WEBSITE + '/settings/configure-windows-firewall/';
Config.URL_COMMON_ISSUES = Config.URL_WEBSITE + '/settings/common-issues/';
Config.URL_FAQ = Config.URL_WEBSITE + '/frequently-asked-questions/';
Config.URL_SUPPORTED_DATE_FORMATS = Config.URL_WEBSITE + '/supported-date-formats/';
Config.URL_API = Config.URL_WEBSITE + "http-api.json";
Config.URL_GITHUB_SERVER = 'https://github.com/fttx/barcode-to-pc-server';
Config.URL_GITHUB_APP = 'https://github.com/fttx/barcode-to-pc-app';
Config.URL_ORDERS_SUPPORT = 'https://barcodetopc.com/invoicing/';
Config.URL_GITHUB_CHANGELOG = 'https://raw.githubusercontent.com/fttx/barcode-to-pc-server/master/CHANGELOG.md';
Config.URL_TUTORIAL_KEYBOARD_EMULATION = 'https://docs.barcodetopc.com/keyboard-emulation/';
Config.URL_TUTORIAL_JAVASCRIPT_FUNCTION = 'https://docs.barcodetopc.com/output-template/components/javascript_function/';
Config.URL_TUTORIAL_IF = 'https://docs.barcodetopc.com/output-template/components/if/';
Config.URL_TUTORIAL_RUN = 'https://docs.barcodetopc.com/output-template/components/run/';
Config.URL_TUTORIAL_CSV_LOOKUP = 'https://docs.barcodetopc.com/output-template/components/csv_lookup/';
Config.URL_TUTORIAL_CSV_UPDATE = 'https://docs.barcodetopc.com/output-template/components/csv_update/';
Config.URL_TUTORIAL_CREATE_OUTPUT_TEMPLATE = 'https://docs.barcodetopc.com/output-template/how-it-works/';
Config.URL_TUTORIAL_MACOS_ACCESSIBILITY = 'https://docs.barcodetopc.com/keyboard-emulation/#nothing-gets-type-macos-only';
Config.URL_TUTORIAL_HTTP = 'https://docs.barcodetopc.com/output-template/components/http_request/';
Config.URL_TUTORIAL_WOOCOMMERCE = 'https://docs.barcodetopc.com/output-template/components/woocommerce/';
Config.URL_TUTORIAL_IMAGE = 'https://docs.barcodetopc.com/output-template/components/image/';
Config.URL_DOWNGRADE_V3 = Config.URL_WEBSITE + '/downgrade-app-from-v4-to-v3/';
Config.URL_PAIR = 'https://app.barcodetopc.com';
Config.EMAIL_SUPPORT = 'support@barcodetopc.com';
Config.INCENTIVE_EMAIL_SHOW_THRESHOLD = 10;
// Constants
Config.STORAGE_SUBSCRIPTION = 'subscription';
Config.STORAGE_SERIAL = 'serial';
Config.STORAGE_FIRST_LICENSE_CHECK_FAIL_DATE = 'storage_first_license_check_fail_date'; // contains the date of the first time that the license check failed to receive a vaild response (eg. no internet connection)
Config.STORAGE_MONTHLY_SCAN_COUNT = 'storage_monthly_scan_count';
Config.STORAGE_LAST_SCAN_COUNT_RESET_DATE = 'storage_last_scan_count_reset_date';
Config.STORAGE_NEXT_CHARGE_DATE = 'storage_next_charge_date';
Config.STORAGE_FIRST_CONNECTION_DATE = 'storage_first_connection_date';
Config.STORAGE_SCAN_SESSIONS = 'storage_scan_sessions';
Config.STORAGE_SETTINGS = 'storage_settings';
Config.STORAGE_LAST_VERSION = 'storage_last_version';
Config.STORAGE_LICENSE_EVER_ACTIVATED = 'storage_license_ever_activated';
Config.STORAGE_SAVED_GEOLOCATIONS = 'storage_saved_geolocations';
Config.GAPIS_CREDENTIALS = {
    // 1. Generate credentials: https://console.cloud.google.com/apis/
    // 2. Create OAuth page and set spreadsheets and drive.metadata.readonly scopes
    "client_id": "162261435624-mpjie85srspdo0nsbsr72nfcibp8c8sf.apps.googleusercontent.com",
    "project_id": "ace-scarab-366420",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_secret": "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",
    "redirect_uri": "https://barcodetopc.com/oauth",
    "javascript_origins": [
        "https://barcodetopc.com"
    ]
};
Config.BTPLINK_PROTOCOL = "btplink";
//# sourceMappingURL=config.js.map