/**
 * The name and address pools the roster generator draws from.
 *
 * ── Why this file is opinionated ────────────────────────────────────────
 * The roster it replaced held thirty-two Anglo-American names — James Wilson,
 * Harper Garcia, Abigail Rodriguez — in a school in Bangalore whose teachers
 * were all named correctly. Every demo, every screenshot and every screen
 * that shows a name showed a school that does not exist anywhere. A fixture is
 * read by people deciding whether the product understands them, so the names
 * have to be the names.
 *
 * ── Communities, not one big list ──────────────────────────────────────
 * Names are grouped by community and drawn as a set: a surname, the given
 * names that go with it, and the parents' generation of the same. Drawn from
 * one flat pool you get *Fatima Iyengar* and *Lakshmi D'Souza* — plausible
 * individually, wrong as a family — and a register full of them reads as
 * generated. Grouping them is the whole difference.
 *
 * Weights approximate a Bangalore private school: a Kannada-speaking
 * majority, sizeable Tamil, Telugu, Malayali and North Indian minorities, and
 * the Muslim and Mangalorean-Catholic communities that have been in the city
 * as long as anyone. They are approximations and not census figures; the point
 * is that no group is missing and none is uniform.
 *
 * The parents' pools are a generation older on purpose. Nobody's father is
 * called Vihaan, and a roster where the fathers are named like the children is
 * the second thing a reader notices after the surnames.
 */

/** One community's names, drawn together so a family is internally coherent. */
export interface Community {
  id: string
  /** Relative share of the roster. See the note above. */
  weight: number
  surnames: readonly string[]
  boys: readonly string[]
  girls: readonly string[]
  fathers: readonly string[]
  mothers: readonly string[]
}

export const COMMUNITIES: readonly Community[] = [
  {
    id: 'kannada',
    weight: 30,
    surnames: [
      'Gowda', 'Hegde', 'Shetty', 'Rao', 'Kulkarni', 'Patil', 'Desai', 'Murthy',
      'Bhat', 'Kamath', 'Nayak', 'Prabhu', 'Acharya', 'Shastri', 'Joshi',
      'Deshpande', 'Hiremath', 'Kittur', 'Malnad', 'Udupa',
    ],
    boys: [
      'Aditya', 'Advait', 'Anirudh', 'Bhuvan', 'Chirag', 'Darshan', 'Gautham',
      'Harsha', 'Jayanth', 'Karthik', 'Keshav', 'Manvanth', 'Nikhil', 'Nithin',
      'Pranav', 'Raghav', 'Rakshith', 'Sanjith', 'Shreyas', 'Sujay', 'Tejas',
      'Varun', 'Vinay', 'Yashas',
    ],
    girls: [
      'Aishwarya', 'Akshara', 'Ananya', 'Bhavana', 'Chaitra', 'Charvi', 'Dhanya',
      'Gagana', 'Harini', 'Ishita', 'Kavya', 'Keerthana', 'Meghana', 'Navya',
      'Niharika', 'Pallavi', 'Rakshita', 'Sahana', 'Sanjana', 'Shravya',
      'Siri', 'Sneha', 'Vaishnavi', 'Varsha',
    ],
    fathers: [
      'Manjunath', 'Nagaraj', 'Shivakumar', 'Basavaraj', 'Chandrashekar',
      'Girish', 'Lokesh', 'Mahesh', 'Prakash', 'Ramesh', 'Sathish', 'Shridhar',
      'Umesh', 'Venkatesh', 'Vishwanath', 'Yogesh',
    ],
    mothers: [
      'Bhavani', 'Chandrika', 'Geetha', 'Jyothi', 'Kavitha', 'Mamatha',
      'Nagarathna', 'Pushpa', 'Rekha', 'Roopa', 'Savitha', 'Shobha', 'Sudha',
      'Sunitha', 'Vani', 'Vasanthi',
    ],
  },
  {
    id: 'tamil',
    weight: 11,
    surnames: [
      'Iyer', 'Iyengar', 'Subramanian', 'Krishnan', 'Raman', 'Balakrishnan',
      'Natarajan', 'Sundaram', 'Venkataraman', 'Srinivasan', 'Chandran',
    ],
    boys: [
      'Aravind', 'Ashwin', 'Hariharan', 'Kaushik', 'Mukund', 'Nandan',
      'Pradeep', 'Rithvik', 'Sabarish', 'Shivram', 'Sriram', 'Vignesh',
      'Vishnu', 'Yuvan',
    ],
    girls: [
      'Abinaya', 'Bhairavi', 'Deepika', 'Divya', 'Janani', 'Kamakshi',
      'Lavanya', 'Madhumitha', 'Nithya', 'Ramya', 'Shruti', 'Swetha',
      'Vaidehi', 'Yamini',
    ],
    fathers: [
      'Balaji', 'Ganesan', 'Kannan', 'Murali', 'Raghunathan', 'Rajagopal',
      'Sekar', 'Shankar', 'Sundar', 'Thyagarajan',
    ],
    mothers: [
      'Alamelu', 'Bhuvaneswari', 'Gomathi', 'Kalyani', 'Meenakshi', 'Padmini',
      'Rajalakshmi', 'Saraswathi', 'Sowmya', 'Vasugi',
    ],
  },
  {
    id: 'telugu',
    weight: 10,
    surnames: [
      'Reddy', 'Naidu', 'Chowdary', 'Rachakonda', 'Yadav', 'Varma',
      'Kondapalli', 'Nagireddy', 'Bhogireddy', 'Pemmasani',
    ],
    boys: [
      'Abhiram', 'Charan', 'Dheeraj', 'Hemanth', 'Kiran', 'Manohar', 'Nagendra',
      'Pavan', 'Rohith', 'Sai Kiran', 'Srikar', 'Teja', 'Vamsi', 'Yashwanth',
    ],
    girls: [
      'Anusha', 'Bhavya', 'Deepthi', 'Haritha', 'Jhansi', 'Lasya', 'Manasa',
      'Nandini', 'Pravallika', 'Sahithi', 'Sirisha', 'Sravani', 'Tejaswini',
      'Vaishnavi',
    ],
    fathers: [
      'Chandra Sekhar', 'Krishna Rao', 'Narasimha', 'Prabhakar', 'Raghava',
      'Ravindra', 'Satyanarayana', 'Srinivasa', 'Venkat Rao', 'Vijay Kumar',
    ],
    mothers: [
      'Aruna', 'Bhagyalakshmi', 'Jayanthi', 'Lakshmi Devi', 'Padmavathi',
      'Rajeswari', 'Sarojini', 'Sridevi', 'Vijayalakshmi', 'Yashoda',
    ],
  },
  {
    id: 'malayali',
    weight: 8,
    surnames: ['Nair', 'Menon', 'Pillai', 'Warrier', 'Kurup', 'Panicker', 'Namboothiri'],
    boys: [
      'Adarsh', 'Anand', 'Arjun', 'Devan', 'Gokul', 'Hari', 'Jishnu', 'Kannan',
      'Nikhil', 'Rahul', 'Sanjay', 'Unnikrishnan', 'Vivek',
    ],
    girls: [
      'Aparna', 'Athira', 'Devika', 'Gayathri', 'Krishnapriya', 'Lekha',
      'Meera', 'Nandana', 'Parvathy', 'Reshma', 'Sreelakshmi', 'Vidya',
    ],
    fathers: [
      'Balachandran', 'Gopalakrishnan', 'Hariharan', 'Mohandas', 'Rajeevan',
      'Sasidharan', 'Sreekumar', 'Unnikrishnan', 'Vijayan',
    ],
    mothers: [
      'Ambika', 'Bindu', 'Girija', 'Lathika', 'Omana', 'Radhika', 'Sheela',
      'Sindhu', 'Usha', 'Vilasini',
    ],
  },
  {
    id: 'north',
    weight: 19,
    surnames: [
      'Sharma', 'Verma', 'Gupta', 'Agarwal', 'Singh', 'Mehta', 'Chauhan',
      'Malhotra', 'Bansal', 'Saxena', 'Tiwari', 'Mishra', 'Kapoor', 'Sethi',
      'Jain', 'Shah', 'Bhatia', 'Ahuja',
    ],
    boys: [
      'Aarav', 'Akshat', 'Aryan', 'Ayush', 'Dev', 'Dhruv', 'Ishaan', 'Kabir',
      'Krish', 'Manav', 'Naman', 'Om', 'Pratham', 'Rudra', 'Samarth',
      'Shaurya', 'Siddharth', 'Vedant', 'Vihaan', 'Vivaan', 'Yash',
    ],
    girls: [
      'Aadhya', 'Aanya', 'Advika', 'Anika', 'Anushka', 'Avni', 'Diya', 'Gauri',
      'Ira', 'Khushi', 'Myra', 'Nidhi', 'Pihu', 'Prisha', 'Riya', 'Saanvi',
      'Shreya', 'Tanvi', 'Trisha', 'Vanya', 'Yashvi',
    ],
    fathers: [
      'Amit', 'Anil', 'Ashok', 'Deepak', 'Manoj', 'Naveen', 'Rajesh', 'Rakesh',
      'Sandeep', 'Sanjay', 'Sunil', 'Vikram', 'Vinod', 'Vivek',
    ],
    mothers: [
      'Anita', 'Archana', 'Kiran', 'Mamta', 'Meenakshi', 'Neelam', 'Poonam',
      'Priti', 'Rachna', 'Ritu', 'Seema', 'Shalini', 'Sunita', 'Vandana',
    ],
  },
  {
    id: 'muslim',
    weight: 12,
    surnames: [
      'Khan', 'Ahmed', 'Sheikh', 'Syed', 'Baig', 'Ansari', 'Qureshi',
      'Pasha', 'Hussain', 'Mansoor', 'Rahman',
    ],
    boys: [
      'Aariz', 'Adnan', 'Ayaan', 'Faizan', 'Ibrahim', 'Imran', 'Mohammed Ali',
      'Rehan', 'Sameer', 'Shoaib', 'Zaid', 'Zayan',
    ],
    girls: [
      'Aaliya', 'Afreen', 'Ayesha', 'Fatima', 'Hiba', 'Iqra', 'Mariam',
      'Nashwa', 'Sana', 'Sumaiya', 'Zainab', 'Zoya',
    ],
    fathers: [
      'Abdul Rahim', 'Anwar', 'Asif', 'Ilyas', 'Javed', 'Mohammed Yousuf',
      'Nazeer', 'Rafiq', 'Saleem', 'Shafiq',
    ],
    mothers: [
      'Fareeda', 'Heena', 'Naseema', 'Nusrat', 'Parveen', 'Rukhsana',
      'Shabana', 'Shaheen', 'Tabassum', 'Yasmin',
    ],
  },
  {
    id: 'christian',
    weight: 7,
    surnames: [
      "D'Souza", 'Fernandes', 'Pereira', 'Lobo', 'Rodrigues', 'Pinto',
      'Mathew', 'Thomas', 'George', 'Sequeira',
    ],
    boys: [
      'Aaron', 'Alwyn', 'Ashton', 'Brian', 'Ivan', 'Joel', 'Jonathan', 'Nikhil',
      'Rohan', 'Ryan', 'Savio', 'Sean',
    ],
    girls: [
      'Aleena', 'Anne', 'Cheryl', 'Clara', 'Elsa', 'Joanna', 'Michelle',
      'Naomi', 'Rhea', 'Serena', 'Sharon', 'Tanya',
    ],
    fathers: [
      'Alban', 'Benedict', 'Denzil', 'Gerald', 'Joseph', 'Lawrence', 'Ronald',
      'Vincent', 'Wilfred', 'Wilson',
    ],
    mothers: [
      'Cynthia', 'Flavia', 'Gladys', 'Juliet', 'Lydia', 'Melba', 'Prema',
      'Rosemary', 'Sandra', 'Veronica',
    ],
  },
  {
    id: 'bengali',
    weight: 3,
    surnames: ['Das', 'Ghosh', 'Banerjee', 'Chatterjee', 'Sen', 'Dutta', 'Bose'],
    boys: ['Ankit', 'Arnab', 'Rishav', 'Sourav', 'Subhrajit', 'Tanmay'],
    girls: ['Ananya', 'Ishani', 'Paromita', 'Rimjhim', 'Shreya', 'Trina'],
    fathers: ['Debashish', 'Partha', 'Prosenjit', 'Subrata', 'Tapan'],
    mothers: ['Aparajita', 'Kakoli', 'Mousumi', 'Rupali', 'Sarmistha'],
  },
]

/**
 * What the parents do.
 *
 * A private school in Bangalore is not all software engineers, and a fee
 * ledger where nobody is ever in arrears is the tell of a fixture written by
 * somebody who only imagined the paying half. The spread here is what makes
 * the arrears tail in the fee generator believable rather than random: the
 * autorickshaw driver's arrears and the bank manager's are not the same story.
 */
export const OCCUPATIONS: readonly string[] = [
  'Software Engineer', 'Software Engineer', 'Software Engineer',
  'Bank Manager', 'Chartered Accountant', 'Civil Engineer', 'Doctor',
  'Government Employee', 'Businessman', 'Shop Owner', 'School Teacher',
  'Homemaker', 'Nurse', 'Police Constable', 'Autorickshaw Driver',
  'BMTC Conductor', 'Tailor', 'Electrician', 'Sales Executive',
  'Lab Technician', 'College Professor', 'Advocate', 'Journalist',
  'Chef', 'Security Guard', 'Farmer', 'Insurance Agent', 'Pharmacist',
]

/** Where a family lives, and the pincode that goes with it. */
export interface Locality {
  name: string
  pincode: string
}

/** One city's residential areas — a school's catchment. */
export interface City {
  name: string
  state: string
  localities: readonly Locality[]
}

export const BANGALORE: City = {
  name: 'Bengaluru',
  state: 'Karnataka',
  localities: [
    { name: 'HSR Layout', pincode: '560102' },
    { name: 'Koramangala', pincode: '560034' },
    { name: 'Jayanagar', pincode: '560041' },
    { name: 'Indiranagar', pincode: '560038' },
    { name: 'Whitefield', pincode: '560066' },
    { name: 'Marathahalli', pincode: '560037' },
    { name: 'BTM Layout', pincode: '560076' },
    { name: 'Rajajinagar', pincode: '560010' },
    { name: 'Basavanagudi', pincode: '560004' },
    { name: 'Malleshwaram', pincode: '560003' },
    { name: 'Yelahanka', pincode: '560064' },
    { name: 'Hebbal', pincode: '560024' },
    { name: 'Banashankari', pincode: '560070' },
    { name: 'J. P. Nagar', pincode: '560078' },
    { name: 'Bellandur', pincode: '560103' },
    { name: 'Kammanahalli', pincode: '560084' },
    { name: 'R. T. Nagar', pincode: '560032' },
    { name: 'Vijayanagar', pincode: '560040' },
    { name: 'Sarjapur Road', pincode: '560035' },
    { name: 'Hennur', pincode: '560043' },
    { name: 'Bommanahalli', pincode: '560068' },
    { name: 'Yeshwanthpur', pincode: '560022' },
    { name: 'Ulsoor', pincode: '560008' },
    { name: 'Electronic City', pincode: '560100' },
  ],
}

export const MYSURU: City = {
  name: 'Mysuru',
  state: 'Karnataka',
  localities: [
    { name: 'Kuvempunagar', pincode: '570023' },
    { name: 'Saraswathipuram', pincode: '570009' },
    { name: 'Jayalakshmipuram', pincode: '570012' },
    { name: 'Gokulam', pincode: '570002' },
    { name: 'Vijayanagar', pincode: '570017' },
    { name: 'Yadavagiri', pincode: '570020' },
    { name: 'Lakshmipuram', pincode: '570004' },
    { name: 'Bogadi', pincode: '570026' },
    { name: 'Vidyaranyapuram', pincode: '570008' },
    { name: 'Chamundipuram', pincode: '570004' },
    { name: 'Hebbal', pincode: '570016' },
    { name: 'Siddhartha Layout', pincode: '570011' },
  ],
}

/** Street names that go in front of a locality. */
export const STREET_FORMS: readonly string[] = [
  '{n}, {ord} Cross, {locality}',
  '{n}, {ord} Main Road, {locality}',
  '{n}/{n2}, {ord} Cross, {locality}',
  'Flat {n2}, Sai Residency, {ord} Cross, {locality}',
  'No. {n}, {ord} Block, {locality}',
  '{n}, {ord} A Cross, {locality}',
]

/** Ordinals for street names — a 47th Cross is a real Bangalore address. */
export const ORDINALS: readonly string[] = [
  '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th',
  '11th', '12th', '14th', '17th', '20th', '24th', '27th', '30th',
]

/** Hobbies for the student-info blob, so the detail page has something true. */
export const HOBBIES: readonly string[] = [
  'Cricket', 'Football', 'Badminton', 'Chess', 'Carnatic vocal', 'Bharatanatyam',
  'Keyboard', 'Reading', 'Drawing', 'Skating', 'Throwball', 'Kabaddi',
  'Robotics', 'Coding', 'Debate', 'Quizzing', 'Swimming', 'Yoga',
  'Classical dance', 'Photography', 'Athletics', 'Table tennis',
]

/** Medical notes. Most students have none, which is why the pool is short. */
export const MEDICAL_NOTES: readonly string[] = [
  'Mild asthma — inhaler with class teacher',
  'Allergic to peanuts',
  'Wears spectacles — front-row seating advised',
  'Lactose intolerant',
  'Dust allergy',
  'Under treatment for anaemia',
]
