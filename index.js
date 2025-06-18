import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Ticket schema
const ticketSchema = new mongoose.Schema({
  // Animal Details
  species: { type: String, required: true },
  nickname: String,
  physicalDescription: String,
  approximateAge: String,

  // Original Location
  originalLocation: String,
  community: String,
  dateLastSeen: Date,

  // Removal Details
  dateOfRelocation: Date,
  takenBy: String,
  organizationOrIndividual: String,
  affiliation: String,
  witnesses: [String],
  removalDescription: String,

  // Current Location
  currentFacility: String,
  facilityWebsite: String,
  facilityAddress: String,
  facilityContact: String,
  facilityPhone: String,
  facilityEmail: String,
  facilitySocial: String,
  rescueOrProtect: { type: String, enum: ['yes', 'no', 'unknown'], default: 'unknown' },

  // Evidence & Proof
  photoUrls: [String],
  videoUrls: [String],
  socialLinks: [String],
  newsLinks: [String],

  // Personal Statement
  fullStory: String,
  whyUnjust: String,

  // Permission or Legal Documentation
  hasDocumentation: { type: String, enum: ['yes', 'no'], default: 'no' },
  documentationUrls: [String],
  documentationDescription: String,

  // Your Info
  submitterName: String,
  submitterEmail: String,
  affirmed: { type: Boolean, default: false },

  // Existing fields
  animal: String, // for backward compatibility
  description: String, // for backward compatibility
  lawsViolated: [String],
  status: { type: String, default: 'pending' },
  upvotes: { type: Number, default: 0 },
  downvotes: { type: Number, default: 0 },
  voters: [{ userId: String, vote: String }], // Track who voted and how
  createdAt: { type: Date, default: Date.now }
});

const Ticket = mongoose.model('Ticket', ticketSchema);

// Submit ticket
app.post('/api/tickets', async (req, res) => {
  const ticket = new Ticket({ ...req.body });
  await ticket.save();
  res.status(201).json(ticket);
});

// Get all tickets (sorted by upvotes)
app.get('/api/tickets', async (req, res) => {
  const tickets = await Ticket.find().sort({ upvotes: -1, createdAt: -1 });
  res.json(tickets);
});

// Upvote/downvote
app.post('/api/tickets/:id/vote', async (req, res) => {
  const { vote, userId } = req.body; // 'up' or 'down', userId required
  if (!userId) return res.status(400).json({ error: 'userId required' });
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
  const existingVote = ticket.voters.find(v => v.userId === userId);
  if (existingVote) return res.status(400).json({ error: 'User already voted' });
  if (vote === 'up') ticket.upvotes++;
  if (vote === 'down') ticket.downvotes++;
  ticket.voters.push({ userId, vote });
  await ticket.save();
  res.json(ticket);
});

// Review (approve/deny) - for admin
app.patch('/api/tickets/:id/review', async (req, res) => {
  const { status } = req.body; // 'approved' or 'denied'
  const ticket = await Ticket.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
  res.json(ticket);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
