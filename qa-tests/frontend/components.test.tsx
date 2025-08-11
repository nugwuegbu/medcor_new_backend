/**
 * Frontend Component QA Tests
 * Testing React components for the MedCor Healthcare Platform
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Component imports (adjust paths as needed)
import AuthModal from '../../client/src/components/auth-modal';
import ChatInterface from '../../client/src/components/chat-interface';
import DoctorCard from '../../client/src/components/doctor-card';
import AppointmentForm from '../../client/src/components/appointment-form';
import MedicalRecordsView from '../../client/src/components/MedicalRecordsView';
import Navbar from '../../client/src/components/navbar';

// Test utilities
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false }
  }
});

const AllTheProviders = ({ children }) => {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </BrowserRouter>
  );
};

const renderWithProviders = (ui, options = {}) =>
  render(ui, { wrapper: AllTheProviders, ...options });

// 1. Authentication Component Tests
describe('Authentication Modal', () => {
  test('should render login form by default', () => {
    renderWithProviders(<AuthModal />);
    expect(screen.getByText(/Sign In/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
  });

  test('should switch between login and signup forms', async () => {
    renderWithProviders(<AuthModal />);
    
    const signupLink = screen.getByText(/Don't have an account/i);
    await userEvent.click(signupLink);
    
    expect(screen.getByText(/Create Account/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();
  });

  test('should validate email format', async () => {
    renderWithProviders(<AuthModal />);
    
    const emailInput = screen.getByLabelText(/Email/i);
    await userEvent.type(emailInput, 'invalid-email');
    
    const submitButton = screen.getByRole('button', { name: /Sign In/i });
    await userEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Invalid email format/i)).toBeInTheDocument();
    });
  });

  test('should handle password requirements', async () => {
    renderWithProviders(<AuthModal />);
    
    const passwordInput = screen.getByLabelText(/Password/i);
    await userEvent.type(passwordInput, '123');
    
    const submitButton = screen.getByRole('button', { name: /Sign In/i });
    await userEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Password must be at least 8 characters/i)).toBeInTheDocument();
    });
  });
});

// 2. Navigation Component Tests
describe('Navigation Bar', () => {
  test('should render all navigation links for authenticated users', () => {
    const mockUser = { id: 1, name: 'John Doe', role: 'patient' };
    renderWithProviders(<Navbar user={mockUser} />);
    
    expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/Appointments/i)).toBeInTheDocument();
    expect(screen.getByText(/Medical Records/i)).toBeInTheDocument();
    expect(screen.getByText(/Chat/i)).toBeInTheDocument();
  });

  test('should show different menu items based on user role', () => {
    const doctorUser = { id: 1, name: 'Dr. Smith', role: 'doctor' };
    renderWithProviders(<Navbar user={doctorUser} />);
    
    expect(screen.getByText(/Patient Management/i)).toBeInTheDocument();
    expect(screen.getByText(/Schedule/i)).toBeInTheDocument();
  });

  test('should handle logout action', async () => {
    const mockUser = { id: 1, name: 'John Doe', role: 'patient' };
    const mockLogout = jest.fn();
    
    renderWithProviders(<Navbar user={mockUser} onLogout={mockLogout} />);
    
    const logoutButton = screen.getByText(/Logout/i);
    await userEvent.click(logoutButton);
    
    expect(mockLogout).toHaveBeenCalled();
  });
});

// 3. Doctor Card Component Tests
describe('Doctor Card', () => {
  const mockDoctor = {
    id: 1,
    name: 'Dr. Sarah Johnson',
    specialty: 'Cardiologist',
    rating: 4.5,
    availability: true,
    profileImage: 'doctor.jpg',
    experience: '10 years',
    education: 'Harvard Medical School'
  };

  test('should display doctor information correctly', () => {
    renderWithProviders(<DoctorCard doctor={mockDoctor} />);
    
    expect(screen.getByText('Dr. Sarah Johnson')).toBeInTheDocument();
    expect(screen.getByText('Cardiologist')).toBeInTheDocument();
    expect(screen.getByText('10 years')).toBeInTheDocument();
    expect(screen.getByText(/4.5/)).toBeInTheDocument();
  });

  test('should show availability status', () => {
    renderWithProviders(<DoctorCard doctor={mockDoctor} />);
    expect(screen.getByText(/Available/i)).toBeInTheDocument();
  });

  test('should handle booking appointment action', async () => {
    const onBook = jest.fn();
    renderWithProviders(<DoctorCard doctor={mockDoctor} onBook={onBook} />);
    
    const bookButton = screen.getByRole('button', { name: /Book Appointment/i });
    await userEvent.click(bookButton);
    
    expect(onBook).toHaveBeenCalledWith(mockDoctor.id);
  });

  test('should display unavailable state correctly', () => {
    const unavailableDoctor = { ...mockDoctor, availability: false };
    renderWithProviders(<DoctorCard doctor={unavailableDoctor} />);
    
    expect(screen.getByText(/Unavailable/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Book Appointment/i })).toBeDisabled();
  });
});

// 4. Appointment Form Tests
describe('Appointment Form', () => {
  const mockDoctor = {
    id: 1,
    name: 'Dr. Sarah Johnson',
    specialty: 'Cardiologist'
  };

  test('should render all form fields', () => {
    renderWithProviders(<AppointmentForm doctor={mockDoctor} />);
    
    expect(screen.getByLabelText(/Date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Time/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Reason for Visit/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Symptoms/i)).toBeInTheDocument();
  });

  test('should validate required fields', async () => {
    renderWithProviders(<AppointmentForm doctor={mockDoctor} />);
    
    const submitButton = screen.getByRole('button', { name: /Book Appointment/i });
    await userEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Date is required/i)).toBeInTheDocument();
      expect(screen.getByText(/Time is required/i)).toBeInTheDocument();
      expect(screen.getByText(/Reason is required/i)).toBeInTheDocument();
    });
  });

  test('should not allow past dates', async () => {
    renderWithProviders(<AppointmentForm doctor={mockDoctor} />);
    
    const dateInput = screen.getByLabelText(/Date/i);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    await userEvent.type(dateInput, yesterday.toISOString().split('T')[0]);
    
    const submitButton = screen.getByRole('button', { name: /Book Appointment/i });
    await userEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Cannot book appointments in the past/i)).toBeInTheDocument();
    });
  });

  test('should handle form submission successfully', async () => {
    const onSubmit = jest.fn();
    renderWithProviders(<AppointmentForm doctor={mockDoctor} onSubmit={onSubmit} />);
    
    const dateInput = screen.getByLabelText(/Date/i);
    const timeInput = screen.getByLabelText(/Time/i);
    const reasonInput = screen.getByLabelText(/Reason for Visit/i);
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    await userEvent.type(dateInput, tomorrow.toISOString().split('T')[0]);
    await userEvent.type(timeInput, '14:00');
    await userEvent.type(reasonInput, 'Regular checkup');
    
    const submitButton = screen.getByRole('button', { name: /Book Appointment/i });
    await userEvent.click(submitButton);
    
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
        doctorId: mockDoctor.id,
        reason: 'Regular checkup'
      }));
    });
  });
});

// 5. Chat Interface Tests
describe('Chat Interface', () => {
  test('should render chat components', () => {
    renderWithProviders(<ChatInterface />);
    
    expect(screen.getByPlaceholderText(/Type your message/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Send/i })).toBeInTheDocument();
  });

  test('should handle message sending', async () => {
    renderWithProviders(<ChatInterface />);
    
    const messageInput = screen.getByPlaceholderText(/Type your message/i);
    const sendButton = screen.getByRole('button', { name: /Send/i });
    
    await userEvent.type(messageInput, 'Hello, I need help');
    await userEvent.click(sendButton);
    
    await waitFor(() => {
      expect(screen.getByText('Hello, I need help')).toBeInTheDocument();
      expect(messageInput).toHaveValue('');
    });
  });

  test('should show typing indicator when AI is responding', async () => {
    renderWithProviders(<ChatInterface />);
    
    const messageInput = screen.getByPlaceholderText(/Type your message/i);
    const sendButton = screen.getByRole('button', { name: /Send/i });
    
    await userEvent.type(messageInput, 'What are my symptoms?');
    await userEvent.click(sendButton);
    
    await waitFor(() => {
      expect(screen.getByText(/AI is typing/i)).toBeInTheDocument();
    });
  });

  test('should disable input while message is being sent', async () => {
    renderWithProviders(<ChatInterface />);
    
    const messageInput = screen.getByPlaceholderText(/Type your message/i);
    const sendButton = screen.getByRole('button', { name: /Send/i });
    
    await userEvent.type(messageInput, 'Test message');
    await userEvent.click(sendButton);
    
    expect(messageInput).toBeDisabled();
    expect(sendButton).toBeDisabled();
  });
});

// 6. Medical Records Tests
describe('Medical Records View', () => {
  const mockRecords = [
    {
      id: 1,
      date: '2024-01-15',
      type: 'Consultation',
      doctor: 'Dr. Johnson',
      diagnosis: 'Common Cold',
      prescription: 'Rest and fluids'
    },
    {
      id: 2,
      date: '2024-02-20',
      type: 'Lab Test',
      doctor: 'Dr. Smith',
      results: 'Normal'
    }
  ];

  test('should display medical records list', () => {
    renderWithProviders(<MedicalRecordsView records={mockRecords} />);
    
    expect(screen.getByText('Common Cold')).toBeInTheDocument();
    expect(screen.getByText('Dr. Johnson')).toBeInTheDocument();
    expect(screen.getByText('Lab Test')).toBeInTheDocument();
  });

  test('should filter records by type', async () => {
    renderWithProviders(<MedicalRecordsView records={mockRecords} />);
    
    const filterSelect = screen.getByLabelText(/Filter by type/i);
    await userEvent.selectOptions(filterSelect, 'Consultation');
    
    expect(screen.getByText('Common Cold')).toBeInTheDocument();
    expect(screen.queryByText('Lab Test')).not.toBeInTheDocument();
  });

  test('should sort records by date', async () => {
    renderWithProviders(<MedicalRecordsView records={mockRecords} />);
    
    const sortButton = screen.getByRole('button', { name: /Sort by date/i });
    await userEvent.click(sortButton);
    
    const records = screen.getAllByTestId('record-item');
    expect(records[0]).toHaveTextContent('2024-02-20');
    expect(records[1]).toHaveTextContent('2024-01-15');
  });

  test('should handle record detail view', async () => {
    renderWithProviders(<MedicalRecordsView records={mockRecords} />);
    
    const viewButton = screen.getAllByRole('button', { name: /View Details/i })[0];
    await userEvent.click(viewButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Prescription: Rest and fluids/i)).toBeInTheDocument();
    });
  });
});

// 7. Face Analysis Widget Tests
describe('Face Analysis Widget', () => {
  test('should request camera permissions on mount', async () => {
    const mockGetUserMedia = jest.fn(() => Promise.resolve({
      getTracks: () => []
    }));
    
    global.navigator.mediaDevices = {
      getUserMedia: mockGetUserMedia
    };
    
    renderWithProviders(<FaceAnalysisWidget />);
    
    await waitFor(() => {
      expect(mockGetUserMedia).toHaveBeenCalledWith({
        video: true,
        audio: false
      });
    });
  });

  test('should display camera permission error', async () => {
    const mockGetUserMedia = jest.fn(() => 
      Promise.reject(new Error('Permission denied'))
    );
    
    global.navigator.mediaDevices = {
      getUserMedia: mockGetUserMedia
    };
    
    renderWithProviders(<FaceAnalysisWidget />);
    
    await waitFor(() => {
      expect(screen.getByText(/Camera access is required/i)).toBeInTheDocument();
    });
  });

  test('should capture and analyze image', async () => {
    renderWithProviders(<FaceAnalysisWidget />);
    
    const captureButton = screen.getByRole('button', { name: /Capture/i });
    await userEvent.click(captureButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Analyzing/i)).toBeInTheDocument();
    });
  });
});

export default {};