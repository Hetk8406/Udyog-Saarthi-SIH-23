"""
SMS Notification Service
========================
Supports multiple interchangeable SMS dispatch backends:
1. FakeConsoleSMSProvider (Default for dev/testing, zero external calls)
2. MSG91SMSProvider (Popular in India with native TRAI DLT header & template support)
3. TwilioSMSProvider (Global SMS provider)

Selected via environment variable:
  SMS_PROVIDER=fake | msg91 | twilio  (defaults to 'fake')

IMPORTANT NOTICE ON INDIA DLT COMPLIANCE:
Under the Telecom Regulatory Authority of India (TRAI) TCCCPR (2018) regulations,
sending SMS to Indian numbers (+91) requires:
- Entity Registration on a Telecom DLT Portal (e.g. Airtel, Jio, Vodafone, BSNL).
- Registered Principal Entity ID (PE ID).
- Approved Sender ID / Header (e.g. UDYOGS, 6 capital alpha characters).
- Pre-approved Content Template ID (DLT_TE_ID) matching the notification text.
Transactional messages without valid registered headers/templates are blocked by Indian telcos.
"""

import os
import json
import base64
import logging
import urllib.request
import urllib.parse
import urllib.error
from typing import Optional

logger = logging.getLogger('notifications.sms')


class BaseSMSProvider:
    """Abstract interface for sending SMS notifications."""
    def send_sms(self, to_phone: str, message: str) -> bool:
        raise NotImplementedError("Subclasses must implement send_sms")


class FakeConsoleSMSProvider(BaseSMSProvider):
    """
    Development & Testing SMS provider:
    Prints formatted SMS alerts to the console and logs without making external HTTP calls.
    """
    def send_sms(self, to_phone: str, message: str) -> bool:
        clean_phone = to_phone.strip() if to_phone else 'UNKNOWN'
        border = "=" * 60
        print(f"\n{border}")
        print("[SMS GATEWAY - UDYOG SAARTHI]")
        print(f"To: {clean_phone}")
        print(f"Message: {message}")
        print(f"{border}\n")

        logger.info(f"[SMS DISPATCH - CONSOLE] To: {clean_phone} | Text: {message}")
        return True


class MSG91SMSProvider(BaseSMSProvider):
    """
    MSG91 SMS Gateway with India TRAI DLT compliance support.
    Requires:
      MSG91_AUTH_KEY: API authentication key
      MSG91_SENDER_ID: 6-character registered DLT header (e.g. UDYOGS)
      MSG91_DLT_TE_ID: Registered DLT Content Template ID
    """
    def __init__(self):
        self.auth_key = os.getenv('MSG91_AUTH_KEY', '').strip()
        self.sender_id = os.getenv('MSG91_SENDER_ID', 'UDYOGS').strip()
        self.dlt_te_id = os.getenv('MSG91_DLT_TE_ID', '').strip()
        self.route = os.getenv('MSG91_ROUTE', '4').strip()  # 4 = Transactional

    def send_sms(self, to_phone: str, message: str) -> bool:
        if not self.auth_key:
            logger.error("[MSG91 SMS] MSG91_AUTH_KEY is not configured.")
            return False

        # Normalize phone (e.g. remove + and spaces)
        clean_phone = to_phone.replace('+', '').replace('-', '').replace(' ', '').strip()

        payload = {
            "sender": self.sender_id,
            "route": self.route,
            "country": "91",
            "sms": [
                {
                    "message": message,
                    "to": [clean_phone],
                }
            ]
        }
        if self.dlt_te_id:
            payload["DLT_TE_ID"] = self.dlt_te_id

        try:
            data = json.dumps(payload).encode('utf-8')
            req = urllib.request.Request(
                "https://api.msg91.com/api/v2/sendsms",
                data=data,
                headers={
                    "authkey": self.auth_key,
                    "Content-Type": "application/json",
                },
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=8) as resp:
                res_data = json.loads(resp.read().decode('utf-8'))
                if res_data.get('type') == 'success' or res_data.get('status') == 'success':
                    logger.info(f"[MSG91 SMS Success] Dispatched to {clean_phone}")
                    return True
                logger.warning(f"[MSG91 SMS Response] {res_data}")
                return False
        except Exception as exc:
            logger.error(f"[MSG91 SMS Failed] Error dispatching to {clean_phone}: {exc}")
            return False


class TwilioSMSProvider(BaseSMSProvider):
    """
    Twilio SMS Gateway provider.
    Requires:
      TWILIO_ACCOUNT_SID: Twilio Account SID
      TWILIO_AUTH_TOKEN: Twilio Auth Token
      TWILIO_FROM_NUMBER: Sender phone number (e.g. +1234567890)
    """
    def __init__(self):
        self.account_sid = os.getenv('TWILIO_ACCOUNT_SID', '').strip()
        self.auth_token = os.getenv('TWILIO_AUTH_TOKEN', '').strip()
        self.from_number = os.getenv('TWILIO_FROM_NUMBER', '').strip()

    def send_sms(self, to_phone: str, message: str) -> bool:
        if not (self.account_sid and self.auth_token and self.from_number):
            logger.error("[Twilio SMS] TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, or TWILIO_FROM_NUMBER missing.")
            return False

        clean_phone = to_phone.strip()
        if not clean_phone.startswith('+'):
            clean_phone = f"+91{clean_phone}"

        endpoint = f"https://api.twilio.com/2010-04-01/Accounts/{self.account_sid}/Messages.json"
        payload = urllib.parse.urlencode({
            'To': clean_phone,
            'From': self.from_number,
            'Body': message,
        }).encode('utf-8')

        credentials = f"{self.account_sid}:{self.auth_token}"
        encoded_auth = base64.b64encode(credentials.encode('utf-8')).decode('utf-8')

        req = urllib.request.Request(
            endpoint,
            data=payload,
            headers={
                'Authorization': f"Basic {encoded_auth}",
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            method="POST"
        )

        try:
            with urllib.request.urlopen(req, timeout=8) as resp:
                res_data = json.loads(resp.read().decode('utf-8'))
                if res_data.get('sid'):
                    logger.info(f"[Twilio SMS Success] Message SID: {res_data.get('sid')} to {clean_phone}")
                    return True
                return False
        except Exception as exc:
            logger.error(f"[Twilio SMS Failed] Error dispatching to {clean_phone}: {exc}")
            return False


def get_sms_provider() -> BaseSMSProvider:
    """Factory function returning the configured SMS provider instance."""
    provider_name = os.getenv('SMS_PROVIDER', 'fake').strip().lower()
    if provider_name == 'msg91':
        return MSG91SMSProvider()
    elif provider_name == 'twilio':
        return TwilioSMSProvider()
    return FakeConsoleSMSProvider()
