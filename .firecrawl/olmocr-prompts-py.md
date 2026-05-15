import re
from dataclasses import dataclass
from typing import Optional

\# This is the prompt we use for getting chat gpt 4o to convert documents into our silver training data
def build\_openai\_silver\_data\_prompt(base\_text: str) -> str:
 return (
 f"Below is the image of one page of a PDF document, as well as some raw textual content that was previously extracted for it that includes position information for each image and block of text (The origin \[0x0\] of the coordinates is in the lower left corner of the image). "
 f"Just return the plain text representation of this document as if you were reading it naturally.\\n"
 f"Turn equations into a LaTeX representation, and tables into markdown format. Remove the headers and footers, but keep references and footnotes.\\n"
 f"Read any natural handwriting.\\n"
 f"This is likely one page out of several in the document, so be sure to preserve any sentences that come from the previous page, or continue onto the next page, exactly as they are.\\n"
 f"If there is no text at all that you think you should read, you can output null.\\n"
 f"Do not hallucinate.\\n"
 f"RAW\_TEXT\_START\\n{base\_text}\\nRAW\_TEXT\_END"
 )

def build\_openai\_silver\_data\_prompt\_v2(base\_text: str) -> str:
 return (
 f"Below is the image of one page of a PDF document, as well as some raw textual content that was previously extracted for it that includes position information for each image and block of text (The origin \[0x0\] of the coordinates is in the lower left corner of the image). "
 f"Just return the plain text representation of this document as if you were reading it naturally.\\n"
 f"Turn equations into a LaTeX representation, make sure to use \\\( and \\\) as a delimiter for inline math, and \\\\[ and \\\\] for block math.\\n"
 f"Convert tables into HTML format. Remove the headers and footers, but keep references and footnotes.\\n"
 f"Read any natural handwriting.\\n"
 f"If there are any figures or charts, label them with the following markdown syntax !\[Alt text describing the contents of the figure\](page\_startx\_starty\_width\_height.png)"
 f"This is likely one page out of several in the document, so be sure to preserve any sentences that come from the previous page, or continue onto the next page, exactly as they are.\\n"
 f"If there is no text at all that you think you should read, you can output null.\\n"
 f"Do not hallucinate.\\n"
 f"RAW\_TEXT\_START\\n{base\_text}\\nRAW\_TEXT\_END"
 )

def build\_openai\_silver\_data\_prompt\_v2\_simple(page\_width: int, page\_height: int) -> str:
 return (
 f"Attached is the image of one page of a PDF document."
 f"Just return the plain text representation of this document as if you were reading it naturally.\\n"
 f"Turn equations and math symbols into a LaTeX representation, make sure to use \\\( and \\\) as a delimiter for inline math, and \\\\[ and \\\\] for block math. Always prefer LaTeX syntax instead of using unicode math symbols.\\n"
 f"Convert tables into HTML format. Remove the headers and footers, but keep references and footnotes.\\n"
 f"Read any natural handwriting.\\n"
 f"If there are any figures or charts, label them with the following markdown syntax !\[Alt text describing the contents of the figure\](page\_startx\_starty\_width\_height.png)"
 f"This is likely one page out of several in the document, so be sure to preserve any sentences that come from the previous page, or continue onto the next page, exactly as they are.\\n"
 f"If there is no text at all that you think you should read, you can output null.\\n"
 f"Do not hallucinate.\\n"
 f"Page width: {page\_width}, Page height: {page\_height}"
 )

def build\_openai\_silver\_data\_prompt\_v3\_simple(page\_width: int, page\_height: int) -> str:
 return (
 f"Attached is the image of one page of a PDF document."
 f"Just return the plain text representation of this document as if you were reading it naturally.\\n"
 f"Turn equations and math symbols into a LaTeX representation, make sure to use \\\( and \\\) as a delimiter for inline math, and \\\\[ and \\\\] for block math. Do NOT use ascii or unicode math symbols such as ∈ ∉ ⊂ ⊃ ⊆ ⊇ ∅ ∪ ∩ ∀ ∃ ¬, just use LaTeX syntax, ex \\\( \\\in \\\) \\\( \\\notin \\\) etc. If you were going to surround a math expression in $ symbols, surround it with \\\( \\\) instead.\\n"
 f"Convert tables into HTML format. Keep the syntax simple, but use for header rows, and use rowspan and colspans appropriately. Don't use

 inside of table cells, just split that into new rows as needed. Do NOT use LaTeX or Markdown table syntax.\\n"
 f"Remove the headers and footers, but keep references and footnotes.\\n"
 f"Read any natural handwriting.\\n"
 f"If there are any figures or charts, label them with the following markdown syntax !\[Alt text describing the contents of the figure\](page\_startx\_starty\_width\_height.png)"
 f"This is likely one page out of several in the document, so be sure to preserve any sentences that come from the previous page, or continue onto the next page, exactly as they are.\\n"
 f"If there is no text at all that you think you should read, you can output null.\\n"
 f"Do not hallucinate.\\n"
 f"Page width: {page\_width}, Page height: {page\_height}"
 )

@dataclass(frozen=True)
class PageResponse:
 primary\_language: Optional\[str\]
 is\_rotation\_valid: bool
 rotation\_correction: int
 is\_table: bool
 is\_diagram: bool
 natural\_text: Optional\[str\]

 def \_\_post\_init\_\_(self):
 # Validate rotation\_correction is one of the allowed values
 if self.rotation\_correction not in {0, 90, 180, 270}:
 raise ValueError("rotation\_correction must be one of \[0, 90, 180, 270\].")

 # Type checks
 if not isinstance(self.primary\_language, (str, type(None))):
 raise TypeError("primary\_language must be of type Optional\[str\].")
 if not isinstance(self.is\_rotation\_valid, bool):
 raise TypeError("is\_rotation\_valid must be of type bool.")
 if not isinstance(self.rotation\_correction, int):
 raise TypeError("rotation\_correction must be of type int.")
 if not isinstance(self.is\_table, bool):
 raise TypeError("is\_table must be of type bool.")
 if not isinstance(self.is\_diagram, bool):
 raise TypeError("is\_diagram must be of type bool.")
 if not isinstance(self.natural\_text, (str, type(None))):
 raise TypeError("natural\_text must be of type Optional\[str\].")

def openai\_response\_format\_schema() -> dict:
 return {
 "type": "json\_schema",
 "json\_schema": {
 "name": "page\_response",
 "schema": {
 "type": "object",
 "properties": {
 "primary\_language": {
 "type": \["string", "null"\],
 "description": "The primary language of the text using two-letter codes or null if there is no text at all that you think you should read.",
 },
 "is\_rotation\_valid": {
 "type": "boolean",
 "description": "Is this page oriented correctly for reading? Answer only considering the textual content, do not factor in the rotation of any charts, tables, drawings, or figures.",
 },
 "rotation\_correction": {
 "type": "integer",
 "description": "Indicates the degree of clockwise rotation needed if the page is not oriented correctly.",
 "enum": \[0, 90, 180, 270\],
 "default": 0,
 },
 "is\_table": {
 "type": "boolean",
 "description": "Indicates if the majority of the page content is in tabular format.",
 },
 "is\_diagram": {
 "type": "boolean",
 "description": "Indicates if the majority of the page content is a visual diagram.",
 },
 "natural\_text": {
 "type": \["string", "null"\],
 "description": "The natural text content extracted from the page.",
 },
 },
 "additionalProperties": False,
 "required": \[\
 "primary\_language",\
 "is\_rotation\_valid",\
 "rotation\_correction",\
 "is\_table",\
 "is\_diagram",\
 "natural\_text",\
 \],
 },
 "strict": True,
 },
 }

\# This is a base prompt that will be used for training and running the fine tuned model
\# It's simplified from the prompt which was used to generate the silver data, and can change from dataset to dataset
def build\_finetuning\_prompt(base\_text: str) -> str:
 return (
 f"Below is the image of one page of a document, as well as some raw textual content that was previously extracted for it. "
 f"Just return the plain text representation of this document as if you were reading it naturally.\\n"
 f"Do not hallucinate.\\n"
 f"RAW\_TEXT\_START\\n{base\_text}\\nRAW\_TEXT\_END"
 )

def build\_no\_anchoring\_yaml\_prompt() -> str:
 return (
 "Attached is one page of a document that you must process. "
 "Just return the plain text representation of this document as if you were reading it naturally. Convert equations to LateX and tables to markdown.\\n"
 "Return your output as markdown, with a front matter section on top specifying values for the primary\_language, is\_rotation\_valid, rotation\_correction, is\_table, and is\_diagram parameters."
 )

def build\_no\_anchoring\_v4\_yaml\_prompt() -> str:
 return (
 "Attached is one page of a document that you must process. "
 "Just return the plain text representation of this document as if you were reading it naturally. Convert equations to LateX and tables to HTML.\\n"
 "If there are any figures or charts, label them with the following markdown syntax !\[Alt text describing the contents of the figure\](page\_startx\_starty\_width\_height.png)\\n"
 "Return your output as markdown, with a front matter section on top specifying values for the primary\_language, is\_rotation\_valid, rotation\_correction, is\_table, and is\_diagram parameters."
 )

\# Extracts the anchor text component from an existing prompt string
def extract\_raw\_text(prompt: str) -> str:
 pattern = r"RAW\_TEXT\_START\\s\*\\n(.\*?)\\nRAW\_TEXT\_END"

 # Use re.DOTALL to ensure that the dot matches newline characters
 match = re.search(pattern, prompt, re.DOTALL)

 if match:
 return match.group(1).strip()
 else:
 raise ValueError("Prompt does not contain raw text")