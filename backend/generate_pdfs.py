"""Generate ISL Learning PDF resources using fpdf2."""
import os, sys

try:
    from fpdf import FPDF
except ImportError:
    os.system(f"{sys.executable} -m pip install fpdf2")
    from fpdf import FPDF

OUT = os.path.join(os.path.dirname(__file__), "resources", "pdfs")
os.makedirs(OUT, exist_ok=True)


class ISLDoc(FPDF):
    def header(self):
        self.set_font("Helvetica", "B", 14)
        self.cell(0, 10, "Indian Sign Language (ISL) Learning Resource", align="C", new_x="LMARGIN", new_y="NEXT")
        self.ln(4)

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "I", 8)
        self.cell(0, 10, f"Page {self.page_no()}/{{nb}}", align="C")

    def title_page(self, title, subtitle):
        self.add_page()
        self.ln(60)
        self.set_font("Helvetica", "B", 28)
        self.cell(0, 15, title, align="C", new_x="LMARGIN", new_y="NEXT")
        self.ln(8)
        self.set_font("Helvetica", "", 14)
        self.cell(0, 10, subtitle, align="C", new_x="LMARGIN", new_y="NEXT")
        self.ln(20)
        self.set_font("Helvetica", "I", 10)
        self.cell(0, 8, "ISL Translation System - Learning Platform", align="C", new_x="LMARGIN", new_y="NEXT")

    def chapter(self, title, body):
        self.add_page()
        self.set_font("Helvetica", "B", 16)
        self.set_fill_color(41, 128, 185)
        self.set_text_color(255)
        self.cell(0, 12, f"  {title}", fill=True, new_x="LMARGIN", new_y="NEXT")
        self.set_text_color(0)
        self.ln(6)
        self.set_font("Helvetica", "", 11)
        self.multi_cell(0, 6, body)
        self.ln(4)

    def section(self, title, body):
        self.ln(4)
        self.set_font("Helvetica", "B", 13)
        self.set_text_color(41, 128, 185)
        self.cell(0, 8, title, new_x="LMARGIN", new_y="NEXT")
        self.set_text_color(0)
        self.set_font("Helvetica", "", 11)
        self.multi_cell(0, 6, body)
        self.ln(2)


# ── 1. Beginner Alphabet Guide ──
def gen_alphabet():
    pdf = ISLDoc()
    pdf.alias_nb_pages()
    pdf.title_page("ISL Alphabet Guide", "Beginner Level - Finger Spelling A-Z")

    pdf.chapter("Introduction to ISL Finger Spelling",
        "Indian Sign Language (ISL) uses a one-handed finger-spelling system to represent "
        "the 26 letters of the English alphabet. Finger spelling is essential for spelling "
        "names, places, and words that do not have a dedicated sign.\n\n"
        "Key principles:\n"
        "- Use your dominant hand consistently\n"
        "- Keep your hand at shoulder height\n"
        "- Face your palm toward the viewer\n"
        "- Maintain a steady pace when spelling words")

    letters = {
        "A": "Make a fist with thumb resting on the side of the index finger.",
        "B": "Hold all four fingers straight up, together, with thumb tucked across palm.",
        "C": "Curve all fingers and thumb into a C shape, like holding a cup.",
        "D": "Index finger points up, other fingers curl to touch thumb tip forming a circle.",
        "E": "Curl all fingers down, thumb tucked under fingertips.",
        "F": "Touch index finger tip to thumb tip forming a circle, other fingers straight up.",
        "G": "Index finger and thumb point sideways, parallel to each other, other fingers curled.",
        "H": "Index and middle fingers extend sideways together, other fingers curled.",
        "I": "Make a fist with pinky finger extended straight up.",
        "J": "Start with I handshape, trace a J motion downward with the pinky.",
        "K": "Index finger up, middle finger angled forward, thumb between them.",
        "L": "Index finger points up, thumb extends sideways forming an L shape.",
        "M": "Three fingers (index, middle, ring) draped over thumb, fist closed.",
        "N": "Two fingers (index, middle) draped over thumb, fist closed.",
        "O": "All fingertips touch thumb tip forming an O/circle shape.",
        "P": "Similar to K but hand points downward at an angle.",
        "Q": "Similar to G but hand points downward.",
        "R": "Cross index and middle fingers, other fingers curled.",
        "S": "Make a fist with thumb wrapped over the front of fingers.",
        "T": "Thumb tucked between index and middle fingers in a fist.",
        "U": "Index and middle fingers point up together, other fingers curled.",
        "V": "Index and middle fingers spread apart in a V, other fingers curled.",
        "W": "Index, middle, and ring fingers spread apart pointing up, pinky curled.",
        "X": "Index finger hooks/bends at first knuckle, other fingers in fist.",
        "Y": "Thumb and pinky extend outward, other three fingers curled.",
        "Z": "Index finger traces a Z shape in the air.",
    }

    pdf.chapter("The ISL Alphabet A-M", "Below are detailed descriptions of hand shapes for letters A through M.")
    for ch in "ABCDEFGHIJKLM":
        pdf.section(f"Letter {ch}", letters[ch])

    pdf.chapter("The ISL Alphabet N-Z", "Below are detailed descriptions of hand shapes for letters N through Z.")
    for ch in "NOPQRSTUVWXYZ":
        pdf.section(f"Letter {ch}", letters[ch])

    pdf.chapter("Practice Tips",
        "1. Practice each letter for 5 minutes daily.\n"
        "2. Spell common words: your name, city, everyday objects.\n"
        "3. Practice in front of a mirror to check hand orientation.\n"
        "4. Use the AI Practice mode in this app to get real-time feedback.\n"
        "5. Speed will come naturally - focus on accuracy first.")

    pdf.output(os.path.join(OUT, "isl_alphabet_beginner.pdf"))
    print("Created: isl_alphabet_beginner.pdf")


# ── 2. Numbers & Counting ──
def gen_numbers():
    pdf = ISLDoc()
    pdf.alias_nb_pages()
    pdf.title_page("ISL Numbers & Counting", "Beginner Level - Numbers 1-100")

    pdf.chapter("Counting in ISL",
        "ISL uses specific hand shapes for numbers. Numbers 1-5 use extended fingers, "
        "while higher numbers combine movements and orientations.\n\n"
        "Numbers are fundamental for everyday communication: telling time, prices, "
        "addresses, phone numbers, and quantities.")

    nums = [
        ("1", "Extend index finger upward, all other fingers curled into fist."),
        ("2", "Extend index and middle fingers upward in a V shape."),
        ("3", "Extend index, middle, and ring fingers upward."),
        ("4", "Extend all four fingers (not thumb) upward, spread slightly."),
        ("5", "Open hand with all five fingers spread apart."),
        ("6", "Touch pinky tip to thumb tip, other three fingers extended."),
        ("7", "Touch ring finger tip to thumb tip, other fingers extended."),
        ("8", "Touch middle finger tip to thumb tip, other fingers extended."),
        ("9", "Touch index finger tip to thumb tip, other fingers extended."),
        ("10", "Shake a thumbs-up hand or flick thumb off index finger."),
    ]

    pdf.chapter("Numbers 1-10", "These are the foundational number signs in ISL.")
    for n, desc in nums:
        pdf.section(f"Number {n}", desc)

    pdf.chapter("Numbers 11-20",
        "11-19: Sign the digit (1-9) and then add a twist of the wrist.\n"
        "20: Touch index and thumb together twice, or sign 2 then 0.\n\n"
        "Common usage: Age, time (hours), dates.")

    pdf.chapter("Tens (10-100)",
        "Multiples of ten typically combine the digit with a specific movement:\n"
        "- 20: Sign 2 + 0\n- 30: Sign 3 + 0\n- 40: Sign 4 + 0\n"
        "- 50: Sign 5 + 0\n- 60-90: Follow the same pattern\n"
        "- 100: Sign 1 then C handshape\n\n"
        "For compound numbers like 45, sign 4 then 5.")

    pdf.chapter("Practice Exercises",
        "1. Sign your phone number.\n"
        "2. Sign today's date (day, month, year).\n"
        "3. Practice counting from 1 to 20 smoothly.\n"
        "4. Sign prices at a store (e.g., Rs. 150, Rs. 75).\n"
        "5. Tell your age and birth year in ISL.")

    pdf.output(os.path.join(OUT, "isl_numbers_beginner.pdf"))
    print("Created: isl_numbers_beginner.pdf")


# ── 3. Common Phrases - Intermediate ──
def gen_phrases():
    pdf = ISLDoc()
    pdf.alias_nb_pages()
    pdf.title_page("ISL Common Phrases", "Intermediate Level - Everyday Communication")

    pdf.chapter("Introduction",
        "This guide covers essential everyday phrases in ISL. Unlike spoken languages, "
        "ISL uses facial expressions and body language as grammatical markers. "
        "A questioning facial expression replaces a question mark; raised eyebrows "
        "indicate yes/no questions while furrowed brows indicate wh-questions.")

    greetings = [
        ("Hello / Namaste", "Both palms together at chest level, slight bow of the head."),
        ("Good Morning", "Sign 'good' (thumbs up) + 'morning' (flat hand rises like the sun from below chin upward)."),
        ("Good Night", "Sign 'good' (thumbs up) + 'night' (dominant hand arcs downward over non-dominant flat hand)."),
        ("Thank You", "Touch fingertips to chin, then move hand forward and slightly down, palm up."),
        ("Sorry / Excuse Me", "Make a fist and rub it in a circular motion on your chest."),
        ("Please", "Open palm on chest, circular motion."),
        ("How are you?", "Point to person, then both thumbs up with questioning expression."),
        ("I am fine", "Touch chest (I), then thumbs up (fine/good)."),
        ("My name is...", "Touch chest (my), then finger-spell your name."),
        ("Nice to meet you", "Sign 'nice' + point to other person + clasp hands together."),
    ]

    pdf.chapter("Greetings & Pleasantries", "Essential social phrases for daily interaction.")
    for phrase, desc in greetings:
        pdf.section(phrase, desc)

    questions = [
        ("What is your name?", "Point (you) + name sign (tap index and middle on forehead) + questioning face."),
        ("Where do you live?", "Sign 'where' (wave index finger side to side) + 'you' + 'live' (both hands move up torso)."),
        ("What time is it?", "Tap wrist (time) + questioning facial expression."),
        ("How much does it cost?", "Rub thumb across fingertips (money) + questioning expression."),
    ]

    pdf.chapter("Common Questions", "Asking questions with proper ISL grammar and facial expressions.")
    for phrase, desc in questions:
        pdf.section(phrase, desc)

    pdf.chapter("ISL Grammar Basics",
        "Key differences from spoken language:\n\n"
        "1. Word Order: ISL typically follows Subject-Object-Verb (SOV) order.\n"
        "   English: 'I eat food' -> ISL: 'I food eat'\n\n"
        "2. Facial Expressions: These are grammatical, not optional.\n"
        "   - Yes/No questions: raised eyebrows\n"
        "   - Wh-questions: furrowed brows\n"
        "   - Negation: head shake while signing\n\n"
        "3. Spatial Grammar: Signs are placed in space to indicate relationships.\n"
        "   - Point to locations to establish subjects\n"
        "   - Direct verb movements between locations\n\n"
        "4. Non-manual Signals: Head movements, eye gaze, mouth patterns.")

    pdf.output(os.path.join(OUT, "isl_phrases_intermediate.pdf"))
    print("Created: isl_phrases_intermediate.pdf")


# ── 4. Grammar & Sentence Structure - Intermediate ──
def gen_grammar():
    pdf = ISLDoc()
    pdf.alias_nb_pages()
    pdf.title_page("ISL Grammar & Sentence Structure", "Intermediate Level")

    pdf.chapter("ISL Sentence Structure",
        "ISL follows a distinct grammatical structure different from spoken Hindi or English.\n\n"
        "Basic sentence structure: TOPIC - COMMENT\n"
        "Time indicators come first, followed by the subject, object, and verb.\n\n"
        "Example:\n"
        "English: 'Yesterday I went to the market'\n"
        "ISL: 'YESTERDAY MARKET I GO' (Time-Object-Subject-Verb)")

    pdf.chapter("Verb Types in ISL",
        "1. Plain Verbs: Do not change based on subject/object (e.g., KNOW, LIKE, WANT)\n\n"
        "2. Directional Verbs: Move between subject and object locations in signing space "
        "(e.g., GIVE moves from giver to receiver, ASK, TELL, SHOW)\n\n"
        "3. Spatial Verbs: Incorporate location information (e.g., PUT, MOVE)")

    pdf.chapter("Negation",
        "Methods of negation in ISL:\n\n"
        "1. Head shake while signing the verb\n"
        "2. Adding NOT sign after the verb\n"
        "3. Using specific negative signs: NOTHING, NEVER, NONE\n\n"
        "Example: 'I don't understand' -> 'I UNDERSTAND' + head shake")

    pdf.chapter("Classifiers",
        "Classifiers are handshapes that represent categories of objects:\n\n"
        "- Flat hand (B): vehicles, surfaces, paper\n"
        "- Index finger (1): people standing, thin objects\n"
        "- Curved hand (C): cylindrical objects, cups\n"
        "- V handshape: people sitting, animals\n"
        "- Fist (S): holding objects\n\n"
        "Classifiers are used to show movement, location, and interaction of objects.")

    pdf.output(os.path.join(OUT, "isl_grammar_intermediate.pdf"))
    print("Created: isl_grammar_intermediate.pdf")


# ── 5. Advanced Conversation - Advanced ──
def gen_advanced():
    pdf = ISLDoc()
    pdf.alias_nb_pages()
    pdf.title_page("Advanced ISL Conversation", "Advanced Level - Fluency & Expression")

    pdf.chapter("Advanced Discourse",
        "At the advanced level, fluency requires mastering:\n\n"
        "1. Role shifting - taking on different characters in a narrative\n"
        "2. Constructed dialogue - showing what someone said vs. narrating\n"
        "3. Spatial reference maintenance - keeping track of established referents\n"
        "4. Register variation - formal vs. informal signing\n"
        "5. Emotional prosody through non-manual features")

    pdf.chapter("Role Shifting",
        "Role shifting allows a signer to take on the perspective of different people:\n\n"
        "- Shift your body, head, and eye gaze to indicate a change in speaker\n"
        "- Each character occupies a specific spatial location\n"
        "- Facial expressions match the character's emotions\n"
        "- Return to neutral position for narrator perspective\n\n"
        "Practice: Tell a story involving two people having a disagreement, "
        "shifting between their perspectives.")

    pdf.chapter("Regional Variations in India",
        "ISL varies across regions:\n\n"
        "- Mumbai, Delhi, Kolkata, and Chennai have notable dialect differences\n"
        "- Some signs differ completely between regions\n"
        "- School-based sign systems influence local variants\n"
        "- Understanding multiple variants improves comprehension\n\n"
        "Tip: When communicating with signers from different regions, "
        "be prepared to negotiate meaning and ask for clarification.")

    pdf.chapter("Professional & Academic Signing",
        "Specialized vocabulary for professional contexts:\n\n"
        "Medical: Common medical terms, body parts, symptoms\n"
        "Legal: Rights, laws, court proceedings\n"
        "Technology: Computer terms, internet, social media\n"
        "Education: Academic subjects, classroom vocabulary\n\n"
        "Many technical terms are finger-spelled or use initialized signs.")

    pdf.chapter("Deaf Culture & Etiquette",
        "Understanding Deaf culture is essential:\n\n"
        "1. Get attention properly: tap shoulder, wave, flash lights\n"
        "2. Maintain eye contact during conversation\n"
        "3. Do not walk between two people signing\n"
        "4. Be patient - do not rush the signer\n"
        "5. Ask permission before interpreting for someone\n"
        "6. 'Deaf' is not a negative term in the community\n"
        "7. Respect that ISL is a complete, independent language")

    pdf.output(os.path.join(OUT, "isl_advanced_conversation.pdf"))
    print("Created: isl_advanced_conversation.pdf")


# ── 6. Complete Reference Dictionary ──
def gen_dictionary():
    pdf = ISLDoc()
    pdf.alias_nb_pages()
    pdf.title_page("ISL Reference Dictionary", "Comprehensive Sign Reference")

    categories = {
        "Family": [
            ("Mother", "Tap thumb on chin twice with open hand."),
            ("Father", "Tap thumb on forehead twice with open hand."),
            ("Brother", "Sign MALE + point index fingers together sideways."),
            ("Sister", "Sign FEMALE + point index fingers together sideways."),
            ("Child", "Lower flat hand indicating height."),
            ("Family", "Both hands make F shapes, circle outward to form a circle."),
        ],
        "Food & Drink": [
            ("Water", "W handshape taps chin."),
            ("Food / Eat", "Bring bunched fingertips to mouth repeatedly."),
            ("Tea", "Mime dipping a tea bag in a cup."),
            ("Rice", "Scoop motion with cupped hand toward mouth."),
            ("Milk", "Squeeze motion with fist (milking)."),
        ],
        "Colors": [
            ("Red", "Stroke index finger down lips."),
            ("Blue", "B handshape shakes slightly."),
            ("Green", "G handshape twists at wrist."),
            ("Yellow", "Y handshape shakes at side."),
            ("White", "Pull hand away from chest, closing fingers."),
            ("Black", "Draw index finger across forehead."),
        ],
        "Emotions": [
            ("Happy", "Brush chest upward with flat hand, smiling face."),
            ("Sad", "Both hands slide down face with sad expression."),
            ("Angry", "Claw hand pulls away from face with furrowed brows."),
            ("Scared", "Both fists open suddenly in front of chest, fearful expression."),
            ("Surprised", "Both hands open near eyes, wide-eyed expression."),
            ("Love", "Cross arms over chest in a hugging motion."),
        ],
        "Daily Activities": [
            ("Work", "S handshapes tap together at wrists."),
            ("Sleep", "Open hand slides down face while closing eyes."),
            ("Study", "Wiggle fingers of one hand toward open palm."),
            ("Go", "Both index fingers point and arc forward."),
            ("Come", "Beckon with index finger toward yourself."),
        ],
    }

    for cat, signs in categories.items():
        pdf.chapter(cat, f"Common signs in the {cat} category:")
        for name, desc in signs:
            pdf.section(name, desc)

    pdf.output(os.path.join(OUT, "isl_dictionary_reference.pdf"))
    print("Created: isl_dictionary_reference.pdf")


# ── 7. Practice Exercises Workbook ──
def gen_exercises():
    pdf = ISLDoc()
    pdf.alias_nb_pages()
    pdf.title_page("ISL Practice Exercises", "All Levels - Workbook")

    pdf.chapter("Beginner Exercises",
        "Exercise 1: Finger Spell Your Name\n"
        "Practice spelling your full name smoothly without pausing between letters.\n\n"
        "Exercise 2: Number Drill\n"
        "Sign numbers 1-20, then random numbers a partner calls out.\n\n"
        "Exercise 3: Alphabet Speed Run\n"
        "Sign A-Z as fast as possible while maintaining clarity. Target: under 30 seconds.\n\n"
        "Exercise 4: Self-Introduction\n"
        "Sign: My name is ___. I am ___ years old. I live in ___. Nice to meet you.")

    pdf.chapter("Intermediate Exercises",
        "Exercise 5: Daily Routine\n"
        "Describe your morning routine using at least 10 signs and proper time markers.\n\n"
        "Exercise 6: Giving Directions\n"
        "Explain how to get from your home to school/work using spatial classifiers.\n\n"
        "Exercise 7: Question Practice\n"
        "Ask and answer 5 wh-questions and 5 yes/no questions with proper facial grammar.\n\n"
        "Exercise 8: Story Retelling\n"
        "Watch a short video clip and retell the story in ISL to a partner.")

    pdf.chapter("Advanced Exercises",
        "Exercise 9: Role Shift Narrative\n"
        "Tell a story with at least 3 characters, using role shifting for each.\n\n"
        "Exercise 10: Debate\n"
        "Pick a topic and present arguments for and against using formal register.\n\n"
        "Exercise 11: Simultaneous Interpretation\n"
        "Have someone read a news article; sign it simultaneously.\n\n"
        "Exercise 12: Free Conversation\n"
        "Have a 10-minute natural conversation with another signer on any topic.")

    pdf.output(os.path.join(OUT, "isl_practice_exercises.pdf"))
    print("Created: isl_practice_exercises.pdf")


if __name__ == "__main__":
    gen_alphabet()
    gen_numbers()
    gen_phrases()
    gen_grammar()
    gen_advanced()
    gen_dictionary()
    gen_exercises()
    print("\nAll PDFs generated successfully!")
