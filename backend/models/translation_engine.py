"""
Multilingual Translation Engine.

Maps (sign_gloss + emotion_label) → natural-language text in EN / TA / HI.

Two modes:
  • Dictionary mode  – fast, offline, finite vocabulary (default).
  • LLM mode         – uses a lightweight language model for open-domain
                       paraphrasing (future extension).

Emotion modulates wording: urgency adds exclamation markers, sadness
softens tone, etc.
"""

import logging
from typing import Optional

logger = logging.getLogger(__name__)

# ── Core dictionary ──────────────────────────────────────────────────────
# Each sign maps to {emotion → {lang → text}}.  The 'neutral' entry is
# the baseline; other emotions override or augment it.

_TRANSLATION_DB: dict[str, dict] = {
    "hello": {
        "neutral":   {"en": "Hello",              "ta": "வணக்கம்",            "hi": "नमस्ते"},
        "happiness": {"en": "Hello! 😊",           "ta": "வணக்கம்! 😊",        "hi": "नमस्ते! 😊"},
        "sadness":   {"en": "Hello...",            "ta": "வணக்கம்...",         "hi": "नमस्ते..."},
    },
    "thank_you": {
        "neutral":   {"en": "Thank you",           "ta": "நன்றி",              "hi": "धन्यवाद"},
        "happiness": {"en": "Thank you so much!",  "ta": "மிக்க நன்றி!",       "hi": "बहुत-बहुत धन्यवाद!"},
        "sadness":   {"en": "Thank you...",         "ta": "நன்றி...",           "hi": "धन्यवाद..."},
    },
    "help": {
        "neutral":   {"en": "I need help",                    "ta": "எனக்கு உதவி தேவை",                "hi": "मुझे मदद चाहिए"},
        "urgency":   {"en": "HELP! I need help urgently!",    "ta": "உதவி! உடனடியாக உதவி தேவை!",       "hi": "मदद! मुझे तुरंत मदद चाहिए!"},
        "fear":      {"en": "Please help me! I'm scared!",   "ta": "தயவுசெய்து உதவுங்கள்! பயமாக உள்ளது!", "hi": "कृपया मेरी मदद करें! मुझे डर लग रहा है!"},
        "anger":     {"en": "I need help NOW!",               "ta": "எனக்கு இப்போதே உதவி வேண்டும்!",    "hi": "मुझे अभी मदद चाहिए!"},
    },
    "please": {
        "neutral":   {"en": "Please",             "ta": "தயவுசெய்து",         "hi": "कृपया"},
        "urgency":   {"en": "Please! Urgently!",  "ta": "தயவுசெய்து! அவசரம்!", "hi": "कृपया! जल्दी!"},
    },
    "sorry": {
        "neutral":   {"en": "Sorry",              "ta": "மன்னிக்கவும்",       "hi": "माफ़ कीजिए"},
        "sadness":   {"en": "I'm really sorry...", "ta": "மிகவும் வருந்துகிறேன்...", "hi": "मुझे बहुत खेद है..."},
        "fear":      {"en": "I'm so sorry, please forgive me", "ta": "மிகவும் மன்னிக்கவும், தயவுசெய்து மன்னியுங்கள்", "hi": "मुझे बहुत खेद है, कृपया माफ़ करें"},
    },
    "yes": {
        "neutral":   {"en": "Yes",                "ta": "ஆம்",                "hi": "हाँ"},
        "happiness": {"en": "Yes! Absolutely!",   "ta": "ஆம்! நிச்சயமாக!",    "hi": "हाँ! बिल्कुल!"},
        "anger":     {"en": "YES!",               "ta": "ஆம்!",               "hi": "हाँ!"},
    },
    "no": {
        "neutral":   {"en": "No",                 "ta": "இல்லை",              "hi": "नहीं"},
        "anger":     {"en": "NO!",                "ta": "இல்லை!",             "hi": "नहीं!"},
        "sadness":   {"en": "No...",              "ta": "இல்லை...",           "hi": "नहीं..."},
        "fear":      {"en": "No! Please no!",     "ta": "இல்லை! தயவுசெய்து இல்லை!", "hi": "नहीं! कृपया नहीं!"},
    },
    "emergency": {
        "neutral":   {"en": "Emergency",                          "ta": "அவசரநிலை",                         "hi": "आपातकाल"},
        "urgency":   {"en": "EMERGENCY! Need immediate help!",    "ta": "அவசரநிலை! உடனடி உதவி தேவை!",        "hi": "आपातकाल! तुरंत मदद चाहिए!"},
        "fear":      {"en": "EMERGENCY! I'm in danger!",          "ta": "அவசரநிலை! நான் ஆபத்தில் இருக்கிறேன்!", "hi": "आपातकाल! मैं ख़तरे में हूँ!"},
    },
    "pain": {
        "neutral":   {"en": "I'm in pain",                        "ta": "எனக்கு வலிக்கிறது",                "hi": "मुझे दर्द हो रहा है"},
        "urgency":   {"en": "I'm in severe pain! Help!",          "ta": "கடுமையான வலி! உதவுங்கள்!",          "hi": "बहुत तेज़ दर्द हो रहा है! मदद!"},
        "sadness":   {"en": "I'm in pain...",                     "ta": "எனக்கு வலிக்கிறது...",              "hi": "मुझे दर्द हो रहा है..."},
        "fear":      {"en": "I'm in pain, please help me!",      "ta": "வலிக்கிறது, தயவுசெய்து உதவுங்கள்!", "hi": "दर्द हो रहा है, कृपया मदद करें!"},
    },
    "danger": {
        "neutral":   {"en": "Danger",                             "ta": "ஆபத்து",                           "hi": "ख़तरा"},
        "urgency":   {"en": "DANGER! Stay away!",                 "ta": "ஆபத்து! விலகி இருங்கள்!",           "hi": "ख़तरा! दूर रहें!"},
        "fear":      {"en": "There's danger! Help!",              "ta": "ஆபத்து இருக்கிறது! உதவுங்கள்!",     "hi": "ख़तरा है! मदद करो!"},
    },
    "fire": {
        "neutral":   {"en": "Fire",                               "ta": "தீ",                                "hi": "आग"},
        "urgency":   {"en": "FIRE! Call fire department!",         "ta": "தீ! தீயணைப்பு வீரர்களை அழையுங்கள்!", "hi": "आग! दमकल को बुलाओ!"},
        "fear":      {"en": "There's a fire! Run!",               "ta": "தீ பிடித்துவிட்டது! ஓடுங்கள்!",     "hi": "आग लगी है! भागो!"},
    },
    "police": {
        "neutral":   {"en": "Police",                             "ta": "காவல்துறை",                         "hi": "पुलिस"},
        "urgency":   {"en": "Call the police immediately!",       "ta": "உடனடியாக காவல்துறையை அழையுங்கள்!",   "hi": "तुरंत पुलिस को बुलाओ!"},
    },
    "hospital": {
        "neutral":   {"en": "Hospital",                           "ta": "மருத்துவமனை",                       "hi": "अस्पताल"},
        "urgency":   {"en": "Take me to the hospital now!",      "ta": "என்னை இப்போதே மருத்துவமனைக்கு கொண்டு செல்லுங்கள்!", "hi": "मुझे अभी अस्पताल ले चलो!"},
        "fear":      {"en": "I need to go to the hospital!",     "ta": "நான் மருத்துவமனைக்கு செல்ல வேண்டும்!", "hi": "मुझे अस्पताल जाना है!"},
    },
    "accident": {
        "neutral":   {"en": "Accident",                           "ta": "விபத்து",                           "hi": "दुर्घटना"},
        "urgency":   {"en": "There's been an accident! Help!",   "ta": "விபத்து நடந்துவிட்டது! உதவுங்கள்!",  "hi": "दुर्घटना हो गई है! मदद करो!"},
    },
    "sick": {
        "neutral":   {"en": "I'm sick",                           "ta": "எனக்கு உடல்நிலை சரியில்லை",         "hi": "मैं बीमार हूँ"},
        "sadness":   {"en": "I feel very sick...",               "ta": "மிகவும் உடல்நிலை சரியில்லை...",      "hi": "मेरी तबियत बहुत ख़राब है..."},
        "urgency":   {"en": "I'm very sick! Need a doctor!",     "ta": "மிகவும் உடல்நிலை சரியில்லை! மருத்துவர் தேவை!", "hi": "मैं बहुत बीमार हूँ! डॉक्टर बुलाओ!"},
    },
    "hurt": {
        "neutral":   {"en": "I'm hurt",                           "ta": "எனக்கு காயம்",                      "hi": "मुझे चोट लगी है"},
        "urgency":   {"en": "I'm badly hurt! Help!",             "ta": "மிகவும் காயம்! உதவுங்கள்!",          "hi": "बुरी तरह चोट लगी है! मदद!"},
    },
    "water": {
        "neutral":   {"en": "Water",                              "ta": "தண்ணீர்",                           "hi": "पानी"},
        "urgency":   {"en": "I need water urgently!",            "ta": "எனக்கு உடனடியாக தண்ணீர் தேவை!",     "hi": "मुझे तुरंत पानी चाहिए!"},
    },
    "food": {
        "neutral":   {"en": "Food",                               "ta": "உணவு",                              "hi": "खाना"},
        "happiness": {"en": "Food! I'm hungry!",                 "ta": "உணவு! பசிக்கிறது!",                 "hi": "खाना! मुझे भूख लगी है!"},
        "urgency":   {"en": "I need food urgently!",             "ta": "எனக்கு உடனடியாக உணவு தேவை!",        "hi": "मुझे तुरंत खाना चाहिए!"},
    },
    "home": {
        "neutral":   {"en": "Home",                               "ta": "வீடு",                              "hi": "घर"},
        "sadness":   {"en": "I want to go home...",              "ta": "நான் வீட்டிற்கு செல்ல விரும்புகிறேன்...", "hi": "मैं घर जाना चाहता हूँ..."},
        "happiness": {"en": "Let's go home!",                    "ta": "வீட்டிற்கு போகலாம்!",                "hi": "चलो घर चलते हैं!"},
    },
    "school": {
        "neutral":   {"en": "School",                             "ta": "பள்ளி",                             "hi": "स्कूल"},
    },
    "work": {
        "neutral":   {"en": "Work",                               "ta": "வேலை",                              "hi": "काम"},
        "anger":     {"en": "Work is stressful!",                "ta": "வேலை மிகவும் கஷ்டமாக உள்ளது!",       "hi": "काम बहुत तनावपूर्ण है!"},
    },
    "family": {
        "neutral":   {"en": "Family",                             "ta": "குடும்பம்",                         "hi": "परिवार"},
        "happiness": {"en": "My family! 😊",                      "ta": "என் குடும்பம்! 😊",                   "hi": "मेरा परिवार! 😊"},
        "sadness":   {"en": "I miss my family...",               "ta": "என் குடும்பம் நினைவுக்கு வருகிறது...", "hi": "मुझे अपने परिवार की याद आती है..."},
    },
    "mother": {
        "neutral":   {"en": "Mother",                             "ta": "அம்மா",                             "hi": "माँ"},
        "happiness": {"en": "My mother! 😊",                      "ta": "என் அம்மா! 😊",                      "hi": "मेरी माँ! 😊"},
        "sadness":   {"en": "I miss my mother...",               "ta": "என் அம்மா நினைவுக்கு வருகிறது...",    "hi": "मुझे अपनी माँ की याद आती है..."},
    },
    "father": {
        "neutral":   {"en": "Father",                             "ta": "அப்பா",                             "hi": "पिताजी"},
        "happiness": {"en": "My father! 😊",                      "ta": "என் அப்பா! 😊",                      "hi": "मेरे पिताजी! 😊"},
    },
    "friend": {
        "neutral":   {"en": "Friend",                             "ta": "நண்பர்",                            "hi": "दोस्त"},
        "happiness": {"en": "My friend! 😊",                      "ta": "என் நண்பர்! 😊",                     "hi": "मेरा दोस्त! 😊"},
    },
    "love": {
        "neutral":   {"en": "Love",                               "ta": "அன்பு",                             "hi": "प्यार"},
        "happiness": {"en": "I love you! ❤️",                     "ta": "நான் உன்னை நேசிக்கிறேன்! ❤️",        "hi": "मैं तुमसे प्यार करता हूँ! ❤️"},
        "sadness":   {"en": "Love... I miss you",                "ta": "அன்பு... உன்னை நினைக்கிறேன்",       "hi": "प्यार... तुम्हारी याद आती है"},
    },
    "happy": {
        "neutral":   {"en": "Happy",                              "ta": "மகிழ்ச்சி",                         "hi": "ख़ुश"},
        "happiness": {"en": "I'm so happy! 😄",                   "ta": "நான் மிகவும் மகிழ்ச்சியாக இருக்கிறேன்! 😄", "hi": "मैं बहुत ख़ुश हूँ! 😄"},
    },
    "sad": {
        "neutral":   {"en": "Sad",                                "ta": "சோகம்",                             "hi": "दुखी"},
        "sadness":   {"en": "I feel very sad...",                "ta": "மிகவும் சோகமாக உள்ளது...",           "hi": "मैं बहुत दुखी हूँ..."},
    },
    "angry": {
        "neutral":   {"en": "Angry",                              "ta": "கோபம்",                             "hi": "गुस्सा"},
        "anger":     {"en": "I'm very angry!",                   "ta": "நான் மிகவும் கோபமாக இருக்கிறேன்!",   "hi": "मुझे बहुत गुस्सा आ रहा है!"},
    },
    "scared": {
        "neutral":   {"en": "Scared",                             "ta": "பயம்",                              "hi": "डर"},
        "fear":      {"en": "I'm very scared!",                  "ta": "நான் மிகவும் பயமாக இருக்கிறேன்!",    "hi": "मुझे बहुत डर लग रहा है!"},
    },
    "tired": {
        "neutral":   {"en": "Tired",                              "ta": "சோர்வு",                            "hi": "थका हुआ"},
        "sadness":   {"en": "I'm so tired...",                   "ta": "மிகவும் சோர்வாக உள்ளது...",          "hi": "मैं बहुत थक गया हूँ..."},
    },
    "good": {
        "neutral":   {"en": "Good",                               "ta": "நல்லது",                            "hi": "अच्छा"},
        "happiness": {"en": "Very good! 👍",                      "ta": "மிகவும் நல்லது! 👍",                 "hi": "बहुत अच्छा! 👍"},
    },
    "bad": {
        "neutral":   {"en": "Bad",                                "ta": "கெட்டது",                           "hi": "बुरा"},
        "anger":     {"en": "Very bad!",                         "ta": "மிகவும் கெட்டது!",                  "hi": "बहुत बुरा!"},
        "sadness":   {"en": "It's bad...",                       "ta": "கெட்டது...",                        "hi": "बुरा है..."},
    },
    "big": {
        "neutral":   {"en": "Big",                                "ta": "பெரியது",                           "hi": "बड़ा"},
    },
    "small": {
        "neutral":   {"en": "Small",                              "ta": "சிறியது",                           "hi": "छोटा"},
    },
    "come": {
        "neutral":   {"en": "Come",                               "ta": "வா",                                "hi": "आओ"},
        "urgency":   {"en": "Come quickly!",                     "ta": "சீக்கிரம் வா!",                     "hi": "जल्दी आओ!"},
        "anger":     {"en": "Come here now!",                    "ta": "இப்போதே இங்கே வா!",                 "hi": "अभी यहाँ आओ!"},
    },
    "go": {
        "neutral":   {"en": "Go",                                 "ta": "போ",                                "hi": "जाओ"},
        "urgency":   {"en": "Go now! Hurry!",                   "ta": "இப்போதே போ! சீக்கிரம்!",             "hi": "अभी जाओ! जल्दी!"},
        "anger":     {"en": "GO AWAY!",                          "ta": "போய்விடு!",                         "hi": "चले जाओ!"},
    },
    "stop": {
        "neutral":   {"en": "Stop",                               "ta": "நிறுத்து",                          "hi": "रुको"},
        "urgency":   {"en": "STOP! RIGHT NOW!",                  "ta": "நிறுத்து! இப்போதே!",                 "hi": "रुको! अभी!"},
        "anger":     {"en": "STOP IT!",                          "ta": "நிறுத்து!",                         "hi": "बंद करो!"},
        "fear":      {"en": "Please stop! Don't!",              "ta": "தயவுசெய்து நிறுத்துங்கள்! வேண்டாம்!", "hi": "कृपया रुकिए! मत करो!"},
    },
    "wait": {
        "neutral":   {"en": "Wait",                               "ta": "காத்திருங்கள்",                     "hi": "रुकिए"},
        "urgency":   {"en": "Wait! Hold on!",                    "ta": "காத்திருங்கள்! நிறுத்துங்கள்!",      "hi": "रुकिए! ठहरिए!"},
    },
    "understand": {
        "neutral":   {"en": "I understand",                       "ta": "புரிகிறது",                         "hi": "मैं समझता हूँ"},
        "happiness": {"en": "Yes, I understand! 😊",              "ta": "ஆம், புரிகிறது! 😊",                 "hi": "हाँ, मैं समझ गया! 😊"},
    },
    "not_understand": {
        "neutral":   {"en": "I don't understand",                 "ta": "புரியவில்லை",                       "hi": "मुझे समझ नहीं आया"},
        "sadness":   {"en": "I'm sorry, I don't understand...",  "ta": "மன்னிக்கவும், புரியவில்லை...",       "hi": "माफ़ कीजिए, समझ नहीं आया..."},
        "anger":     {"en": "I DON'T understand!",               "ta": "புரியவில்லை!",                      "hi": "मुझे समझ नहीं आ रहा!"},
    },
    "name": {
        "neutral":   {"en": "Name",                               "ta": "பெயர்",                             "hi": "नाम"},
    },
    "my": {
        "neutral":   {"en": "My / Mine",                          "ta": "என்னுடைய",                          "hi": "मेरा"},
    },
    "your": {
        "neutral":   {"en": "Your / Yours",                       "ta": "உன்னுடைய",                          "hi": "तुम्हारा"},
    },
    "what": {
        "neutral":   {"en": "What?",                              "ta": "என்ன?",                             "hi": "क्या?"},
        "anger":     {"en": "WHAT?!",                            "ta": "என்ன?!",                            "hi": "क्या?!"},
        "surprise":  {"en": "What?! Really?",                    "ta": "என்ன?! உண்மையா?",                   "hi": "क्या?! सच में?"},
    },
    "where": {
        "neutral":   {"en": "Where?",                             "ta": "எங்கே?",                            "hi": "कहाँ?"},
        "urgency":   {"en": "Where?! Tell me quickly!",          "ta": "எங்கே?! சீக்கிரம் சொல்லுங்கள்!",    "hi": "कहाँ?! जल्दी बताओ!"},
    },
    "when": {
        "neutral":   {"en": "When?",                              "ta": "எப்போது?",                          "hi": "कब?"},
    },
    "who": {
        "neutral":   {"en": "Who?",                               "ta": "யார்?",                             "hi": "कौन?"},
    },
    "why": {
        "neutral":   {"en": "Why?",                               "ta": "ஏன்?",                              "hi": "क्यों?"},
        "anger":     {"en": "WHY?!",                             "ta": "ஏன்?!",                             "hi": "क्यों?!"},
        "sadness":   {"en": "Why...?",                           "ta": "ஏன்...?",                           "hi": "क्यों...?"},
    },
    "how": {
        "neutral":   {"en": "How?",                               "ta": "எப்படி?",                           "hi": "कैसे?"},
    },
    "money": {
        "neutral":   {"en": "Money",                              "ta": "பணம்",                              "hi": "पैसा"},
        "urgency":   {"en": "I need money urgently!",            "ta": "எனக்கு உடனடியாக பணம் தேவை!",        "hi": "मुझे तुरंत पैसे चाहिए!"},
    },
    "time": {
        "neutral":   {"en": "Time",                               "ta": "நேரம்",                             "hi": "समय"},
        "urgency":   {"en": "There's no time!",                  "ta": "நேரமில்லை!",                        "hi": "समय नहीं है!"},
    },
    "today": {
        "neutral":   {"en": "Today",                              "ta": "இன்று",                             "hi": "आज"},
    },
    "tomorrow": {
        "neutral":   {"en": "Tomorrow",                           "ta": "நாளை",                              "hi": "कल"},
    },
    "yesterday": {
        "neutral":   {"en": "Yesterday",                          "ta": "நேற்று",                            "hi": "कल (बीता)"},
    },
    "morning": {
        "neutral":   {"en": "Morning",                            "ta": "காலை",                              "hi": "सुबह"},
        "happiness": {"en": "Good morning! 😊",                   "ta": "காலை வணக்கம்! 😊",                   "hi": "सुप्रभात! 😊"},
    },
    "night": {
        "neutral":   {"en": "Night",                              "ta": "இரவு",                              "hi": "रात"},
    },
    "eat": {
        "neutral":   {"en": "Eat",                                "ta": "சாப்பிடு",                          "hi": "खाना खाओ"},
        "happiness": {"en": "Let's eat! 😋",                      "ta": "சாப்பிடலாம்! 😋",                    "hi": "चलो खाना खाते हैं! 😋"},
    },
    "drink": {
        "neutral":   {"en": "Drink",                              "ta": "குடி",                              "hi": "पीना"},
        "urgency":   {"en": "I need something to drink now!",    "ta": "எனக்கு இப்போதே குடிக்க வேண்டும்!",   "hi": "मुझे अभी कुछ पीना है!"},
    },
    "sleep": {
        "neutral":   {"en": "Sleep",                              "ta": "தூக்கம்",                           "hi": "सोना"},
        "sadness":   {"en": "I want to sleep...",                "ta": "எனக்கு தூங்க வேண்டும்...",           "hi": "मुझे सोना है..."},
    },
    "walk": {
        "neutral":   {"en": "Walk",                               "ta": "நடை",                               "hi": "चलना"},
    },
    "run": {
        "neutral":   {"en": "Run",                                "ta": "ஓடு",                               "hi": "दौड़ो"},
        "urgency":   {"en": "RUN! NOW!",                         "ta": "ஓடு! இப்போதே!",                     "hi": "भागो! अभी!"},
        "fear":      {"en": "Run! Get out of here!",             "ta": "ஓடு! இங்கிருந்து போ!",              "hi": "भागो! यहाँ से निकलो!"},
    },
    "sit": {
        "neutral":   {"en": "Sit",                                "ta": "உட்காரு",                           "hi": "बैठो"},
    },
    "stand": {
        "neutral":   {"en": "Stand",                              "ta": "நில்",                              "hi": "खड़े हो"},
    },
    "read": {
        "neutral":   {"en": "Read",                               "ta": "படி",                               "hi": "पढ़ो"},
    },
    "write": {
        "neutral":   {"en": "Write",                              "ta": "எழுது",                             "hi": "लिखो"},
    },
    "learn": {
        "neutral":   {"en": "Learn",                              "ta": "கற்றுக்கொள்",                       "hi": "सीखो"},
    },
    "teach": {
        "neutral":   {"en": "Teach",                              "ta": "கற்பி",                             "hi": "सिखाओ"},
    },
    "doctor": {
        "neutral":   {"en": "Doctor",                             "ta": "மருத்துவர்",                        "hi": "डॉक्टर"},
        "urgency":   {"en": "I need a doctor NOW!",              "ta": "எனக்கு இப்போதே மருத்துவர் தேவை!",    "hi": "मुझे अभी डॉक्टर चाहिए!"},
    },
    "medicine": {
        "neutral":   {"en": "Medicine",                           "ta": "மருந்து",                           "hi": "दवाई"},
        "urgency":   {"en": "I need my medicine urgently!",      "ta": "எனக்கு உடனடியாக மருந்து தேவை!",      "hi": "मुझे तुरंत दवाई चाहिए!"},
    },
    "telephone": {
        "neutral":   {"en": "Telephone / Call",                   "ta": "தொலைபேசி",                         "hi": "फ़ोन"},
        "urgency":   {"en": "Call now! It's urgent!",            "ta": "இப்போதே அழையுங்கள்! அவசரம்!",        "hi": "अभी फ़ोन करो! ज़रूरी है!"},
    },
    "bathroom": {
        "neutral":   {"en": "Bathroom",                           "ta": "குளியலறை",                          "hi": "बाथरूम"},
        "urgency":   {"en": "I need the bathroom urgently!",     "ta": "எனக்கு உடனடியாக குளியலறை தேவை!",     "hi": "मुझे तुरंत बाथरूम जाना है!"},
    },
    "bus": {
        "neutral":   {"en": "Bus",                                "ta": "பேருந்து",                          "hi": "बस"},
    },
    "train": {
        "neutral":   {"en": "Train",                              "ta": "ரயில்",                             "hi": "ट्रेन"},
    },
    "car": {
        "neutral":   {"en": "Car",                                "ta": "கார்",                              "hi": "गाड़ी"},
    },
    "shop": {
        "neutral":   {"en": "Shop",                               "ta": "கடை",                               "hi": "दुकान"},
    },
    "market": {
        "neutral":   {"en": "Market",                             "ta": "சந்தை",                             "hi": "बाज़ार"},
    },
    "cold": {
        "neutral":   {"en": "Cold",                               "ta": "குளிர்",                            "hi": "ठंडा"},
    },
    "hot": {
        "neutral":   {"en": "Hot",                                "ta": "சூடு",                              "hi": "गर्म"},
    },
    "rain": {
        "neutral":   {"en": "Rain",                               "ta": "மழை",                               "hi": "बारिश"},
    },
    "boy": {
        "neutral":   {"en": "Boy",                                "ta": "சிறுவன்",                           "hi": "लड़का"},
    },
    "girl": {
        "neutral":   {"en": "Girl",                               "ta": "சிறுமி",                            "hi": "लड़की"},
    },
    "man": {
        "neutral":   {"en": "Man",                                "ta": "ஆண்",                               "hi": "आदमी"},
    },
    "woman": {
        "neutral":   {"en": "Woman",                              "ta": "பெண்",                              "hi": "औरत"},
    },
    "child": {
        "neutral":   {"en": "Child",                              "ta": "குழந்தை",                           "hi": "बच्चा"},
    },
    "baby": {
        "neutral":   {"en": "Baby",                               "ta": "குழந்தை",                           "hi": "शिशु"},
        "happiness": {"en": "Baby! So cute! 😍",                  "ta": "குழந்தை! மிகவும் அழகு! 😍",          "hi": "बच्चा! कितना प्यारा! 😍"},
    },
    "old": {
        "neutral":   {"en": "Old",                                "ta": "பழையது",                            "hi": "पुराना"},
    },
    "new": {
        "neutral":   {"en": "New",                                "ta": "புதியது",                           "hi": "नया"},
    },
    "open": {
        "neutral":   {"en": "Open",                               "ta": "திற",                               "hi": "खोलो"},
    },
    "close": {
        "neutral":   {"en": "Close",                              "ta": "மூடு",                              "hi": "बंद करो"},
    },
    "take": {
        "neutral":   {"en": "Take",                               "ta": "எடு",                               "hi": "लो"},
    },
    "give": {
        "neutral":   {"en": "Give",                               "ta": "கொடு",                              "hi": "दो"},
        "urgency":   {"en": "Give it to me now!",                "ta": "இப்போதே எனக்கு கொடு!",              "hi": "अभी मुझे दो!"},
    },
    "buy": {
        "neutral":   {"en": "Buy",                                "ta": "வாங்கு",                            "hi": "ख़रीदो"},
    },
    "sell": {
        "neutral":   {"en": "Sell",                               "ta": "விற்கவும்",                         "hi": "बेचो"},
    },
    "need": {
        "neutral":   {"en": "I need",                             "ta": "எனக்கு தேவை",                       "hi": "मुझे चाहिए"},
        "urgency":   {"en": "I urgently need!",                  "ta": "எனக்கு உடனடியாக தேவை!",             "hi": "मुझे तुरंत चाहिए!"},
    },
    "want": {
        "neutral":   {"en": "I want",                             "ta": "நான் விரும்புகிறேன்",                "hi": "मैं चाहता हूँ"},
    },
    "can": {
        "neutral":   {"en": "I can",                              "ta": "என்னால் முடியும்",                   "hi": "मैं कर सकता हूँ"},
        "happiness": {"en": "Yes, I can! 💪",                     "ta": "ஆம், என்னால் முடியும்! 💪",          "hi": "हाँ, मैं कर सकता हूँ! 💪"},
    },
    "cannot": {
        "neutral":   {"en": "I cannot",                           "ta": "என்னால் முடியாது",                   "hi": "मैं नहीं कर सकता"},
        "sadness":   {"en": "I can't... I'm sorry",             "ta": "என்னால் முடியாது... மன்னிக்கவும்",   "hi": "मैं नहीं कर सकता... माफ़ कीजिए"},
    },
    "like": {
        "neutral":   {"en": "I like",                             "ta": "எனக்கு பிடிக்கும்",                 "hi": "मुझे पसंद है"},
        "happiness": {"en": "I really like it! 😊",               "ta": "எனக்கு மிகவும் பிடிக்கும்! 😊",      "hi": "मुझे बहुत पसंद है! 😊"},
    },
    "dislike": {
        "neutral":   {"en": "I don't like",                       "ta": "எனக்கு பிடிக்கவில்லை",              "hi": "मुझे पसंद नहीं"},
        "anger":     {"en": "I really don't like this!",         "ta": "எனக்கு இது பிடிக்கவே இல்லை!",       "hi": "मुझे यह बिल्कुल पसंद नहीं!"},
    },
}


# ── Emotion modulation templates ─────────────────────────────────────────
# Applied when an emotion-specific entry is NOT found in the DB.

_EMOTION_TEMPLATES = {
    "happiness":  {"en": "{text}! 😊",          "ta": "{text}! 😊",          "hi": "{text}! 😊"},
    "sadness":    {"en": "{text}...",            "ta": "{text}...",           "hi": "{text}..."},
    "anger":      {"en": "{text}!",             "ta": "{text}!",            "hi": "{text}!"},
    "urgency":    {"en": "(URGENT) {text}!",    "ta": "(அவசரம்) {text}!",   "hi": "(ज़रूरी) {text}!"},
    "fear":       {"en": "{text}! (scared)",    "ta": "{text}! (பயம்)",     "hi": "{text}! (डर)"},
    "surprise":   {"en": "{text}?!",            "ta": "{text}?!",           "hi": "{text}?!"},
    "neutral":    {"en": "{text}",              "ta": "{text}",             "hi": "{text}"},
}


class TranslationEngine:
    """
    Translate (sign_gloss, emotion) → multilingual text.

    Pipeline:
      1. Look up the gloss in _TRANSLATION_DB.
      2. If an emotion-specific entry exists, use it.
      3. Otherwise fall back to the neutral entry with an emotion template.
      4. Optionally call an external translation API for unknown glosses.
    """

    def __init__(self, config: dict):
        self.supported_langs = config.get('SUPPORTED_LANGUAGES',
                                          {'en': 'English', 'ta': 'Tamil', 'hi': 'Hindi'})
        self.default_lang = config.get('DEFAULT_LANGUAGE', 'en')
        self.emergency_signs = [s.lower() for s in config.get('EMERGENCY_SIGNS', [])]
        self.emergency_emotions = [e.lower() for e in config.get('EMERGENCY_EMOTION_BOOST', [])]
        self._db = _TRANSLATION_DB
        self._tpl = _EMOTION_TEMPLATES
        logger.info(f"Translation engine: {len(self._db)} glosses loaded")

    # ── Public API ───────────────────────────────────────────

    def translate(self, sign_gloss: str, emotion: str = 'neutral',
                  emotion_confidence: float = 0.5) -> dict:
        """
        Main translation entry point.

        Returns dict:
            texts        : {lang_code: translated_string}
            is_emergency : bool
            emotion_applied : str (the emotion actually used)
            raw_gloss    : str
        """
        gloss = sign_gloss.lower().strip()
        emotion = emotion.lower().strip()

        # Decide effective emotion (fall back to neutral if confidence is low)
        effective_emotion = emotion if emotion_confidence >= 0.45 else 'neutral'

        texts = self._lookup(gloss, effective_emotion)

        is_emergency = self._check_emergency(gloss, effective_emotion)

        # If emergency and emotion is already urgent, add extra emphasis
        if is_emergency and effective_emotion in self.emergency_emotions:
            texts = {lang: f"⚠️ {t}" for lang, t in texts.items()}

        return {
            'texts': texts,
            'is_emergency': is_emergency,
            'emotion_applied': effective_emotion,
            'raw_gloss': gloss,
        }

    def translate_text_to_isl_gloss(self, text: str, source_lang: str = 'en') -> dict:
        """
        Reverse direction: hearing user's text → ISL-friendly gloss sequence.
        For now, return the simplified keyword sequence.  In future this
        would drive an avatar.
        """
        # Very basic: lower, strip punctuation, split into tokens, match glosses
        import re
        tokens = re.findall(r'\w+', text.lower())
        matched = [t for t in tokens if t in self._db]
        return {
            'gloss_sequence': matched if matched else tokens,
            'display_text': text,
            'source_language': source_lang,
        }

    def get_supported_languages(self) -> dict:
        return self.supported_langs

    # ── Private ──────────────────────────────────────────────

    def _lookup(self, gloss: str, emotion: str) -> dict[str, str]:
        """Look up translation, applying emotion modulation."""
        if gloss not in self._db:
            # Unknown gloss — return as-is with emotion template
            return self._apply_template(gloss.replace('_', ' ').title(), emotion)

        entry = self._db[gloss]

        # Try emotion-specific entry first
        if emotion in entry and emotion != 'neutral':
            return entry[emotion]

        # Fall back to neutral + template
        neutral = entry.get('neutral', {"en": gloss, "ta": gloss, "hi": gloss})
        if emotion != 'neutral':
            return self._apply_template_to_dict(neutral, emotion)
        return neutral

    def _apply_template(self, text: str, emotion: str) -> dict[str, str]:
        """Apply emotion template to a plain text string for all languages."""
        tpl = self._tpl.get(emotion, self._tpl['neutral'])
        return {lang: tpl[lang].format(text=text) for lang in ('en', 'ta', 'hi')}

    def _apply_template_to_dict(self, texts: dict, emotion: str) -> dict[str, str]:
        """Apply emotion template to each language string in a dict."""
        tpl = self._tpl.get(emotion, self._tpl['neutral'])
        return {
            lang: tpl.get(lang, '{text}').format(text=texts.get(lang, ''))
            for lang in ('en', 'ta', 'hi')
        }

    def _check_emergency(self, gloss: str, emotion: str) -> bool:
        return (gloss in self.emergency_signs or
                (emotion in self.emergency_emotions and gloss in self.emergency_signs))