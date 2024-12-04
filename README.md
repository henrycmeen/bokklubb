# README: JSON Structure for Book Entries

This README explains the required structure of the JSON file for book entries. Each entry represents a book with metadata, location data, and user-generated content such as reviews and quotes.

---

## JSON Schema

Each book entry must contain the following fields:

### **1. Basic Information**
- **`id`** (integer): A unique identifier for the book.
  Different people will have different IDs:
  Bookclub: 1000X
  Rasmus:   2000X
  Henry:    3000X
  Andre:    4000X


- **`title`** (string): The title of the book.  
  Example: `"After Dark"`

- **`author`** (string): The author of the book.  
  Example: `"Haruki Murakami"`

- **`cover`** (string): A relative path to the cover image of the book.  
  Example: `"assets/afterdark.jpg"`

- **`releaseDate`** (integer): The year the book was first published.  
  Example: `2004`

- **`genre`** (string): The book's primary genre.  
  Example: `"Fiction"`

- **`length`** (integer): The number of pages in the book.  
  Example: `201`

---

### **2. Additional Attributes**
- **`realism_value`** (integer): A rating from 1 to 10 representing the realism level of the book.  
  Example: `6`

  - **`country`** (string): Orgin of the author.  
  Example: `Norway`

- **`latitude`** (float): The latitude coordinate representing the book's geographical setting or origin.  
  Example: `36.2048` (Tokyo, Japan)

- **`longitude`** (float): The longitude coordinate corresponding to the book's setting or origin.  
  Example: `138.2529` (Tokyo, Japan)

- **`description`** (string): A brief summary of the book.  
  Example: `"A surreal, atmospheric novel that explores the interconnected lives of strangers during a single enigmatic night in Tokyo."`

---

### **3. Reading Metadata**
- **`readDate`** (string): The range of dates when the book was read, formatted as `DD Month - DD Month / YYYY`.  
  Example: `"16 November - 30 November / 2024"`

---

### **4. User Quotes**
- **`quotes`** (object): Contains user-generated reviews and thoughts.  
  Each quote is a key-value pair where:
  - **Key**: A username.
  - **Value**: The user's review or thoughts about the book.
  
  Example:
  ```json
  "quotes": {
    "rasmus": "Dualisme og friheten som en sovende by kan tilby...",
    "henry": "Byen ser alt, men forstår lite...",
    "andre": ""
  }

### **5. Full Example**

```json
{
  "id": 1,
  "title": "After Dark",
  "author": "Haruki Murakami",
  "cover": "assets/afterdark.jpg",
  "releaseDate": 2004,
  "genre": "Fiction",
  "realism_value": 6,
  "length": 201,
  "latitude": 36.2048,
  "longitude": 138.2529,
  "description": "A surreal, atmospheric novel that explores the interconnected lives of strangers during a single enigmatic night in Tokyo.",
  "readDate": "16 November - 30 November / 2024",
  "quotes": {
    "rasmus": "Dualisme og friheten som en sovende by kan tilby...",
    "henry": "Byen ser alt, men forstår lite...",
    "andre": ""
  }
}