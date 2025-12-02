import { useState, type CSSProperties } from 'react';

interface FormData {
  firstName: string;
  lastName: string;
  driver: boolean;
  designation: string;
  accompanying: string;
  mobile: string;
  email: string;
  foodPreference: string[];
  category: string;
  additionalDescription: string;
}

export default function RajBhavanGuestForm() {
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    driver: false,
    designation: '',
    accompanying: '',
    mobile: '',
    email: '',
    foodPreference: [],
    category: '',
    additionalDescription: '',
  });

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleDriverChange = (value: boolean) => {
    setFormData({ ...formData, driver: value });
  };

  const handleFoodPreferenceChange = (preference: string) => {
    const currentPreferences = formData.foodPreference;
    if (currentPreferences.includes(preference)) {
      setFormData({
        ...formData,
        foodPreference: currentPreferences.filter(p => p !== preference)
      });
    } else {
      setFormData({
        ...formData,
        foodPreference: [...currentPreferences, preference]
      });
    }
  };

  const handleSubmit = () => {
    console.log('Form submitted:', formData);
    alert('Form submitted successfully!');
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerTop}>
          <span style={styles.headerText}>GOVERNMENT OF MAHARASHTRA</span>
        </div>
        
        <div style={styles.headerMain}>
          <div style={styles.logoContainer}>
            {/* Ashoka Emblem - You'll need to replace this with actual image */}
            <div style={styles.emblem}>
              <svg viewBox="0 0 50 50" style={{ width: '100%', height: '100%' }}>
                <circle cx="25" cy="25" r="24" fill="#000080" stroke="#FFD700" strokeWidth="2"/>
                <text x="25" y="30" textAnchor="middle" fill="#FFD700" fontSize="12" fontWeight="bold">
                  ॐ
                </text>
              </svg>
            </div>
            <div>
              <div style={styles.rajBhavanMarathi}>राज भवन महाराष्ट्र</div>
              <div style={styles.rajBhavanEnglish}>Raj Bhavan Mahrashtra</div>
            </div>
          </div>
          
          {/* Indian Flag */}
          <div style={styles.flag}>
            <div style={styles.flagOrange}></div>
            <div style={styles.flagWhite}>
              <div style={styles.ashokChakra}></div>
            </div>
            <div style={styles.flagGreen}></div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={styles.navigation}>
          <button style={styles.navItem}>Home</button>
          <button style={styles.navItem}>Admin</button>
          <button style={styles.navItem}>Accommodation</button>
          <button style={styles.navItem}>Transport Cell</button>
          <button style={styles.navItem}>Officer Assignment</button>
          <button style={styles.navItem}>Catering Services</button>
        </nav>
      </header>

      {/* Form */}
      <div style={styles.formContainer}>
        <div style={styles.formCard}>
          <h2 style={styles.formTitle}>GUEST DETAILS</h2>

          <div style={styles.row}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>First Name</label>
              <input
                type="text"
                style={styles.input}
                placeholder="Enter your first name"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
              />
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Last Name</label>
              <input
                type="text"
                style={styles.input}
                placeholder="Enter your last name"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
              />
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Driver</label>
              <div style={styles.radioGroup}>
                <label style={styles.radioLabel}>
                  <input
                    type="radio"
                    name="driver"
                    checked={formData.driver === true}
                    onChange={() => handleDriverChange(true)}
                    style={styles.radioInput}
                  />
                  <span style={styles.radioText}>Yes</span>
                </label>
                <label style={styles.radioLabel}>
                  <input
                    type="radio"
                    name="driver"
                    checked={formData.driver === false}
                    onChange={() => handleDriverChange(false)}
                    style={styles.radioInput}
                  />
                  <span style={styles.radioText}>No</span>
                </label>
              </div>
            </div>
          </div>

          <div style={styles.row}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Guest Designation</label>
              <input
                type="text"
                style={styles.input}
                placeholder="Enter designation"
                value={formData.designation}
                onChange={(e) => handleInputChange('designation', e.target.value)}
              />
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Accompanying Persons</label>
              <input
                type="text"
                style={styles.input}
                placeholder="Enter number of accompanying persons/first name"
                value={formData.accompanying}
                onChange={(e) => handleInputChange('accompanying', e.target.value)}
              />
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Mobile Number</label>
              <input
                type="tel"
                style={styles.input}
                placeholder="Enter mobile number"
                value={formData.mobile}
                onChange={(e) => handleInputChange('mobile', e.target.value)}
              />
            </div>
          </div>

          <div style={styles.row}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Enter Email</label>
              <input
                type="email"
                style={styles.input}
                placeholder="Enter Guest Email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
              />
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Food Preference</label>
              <div style={styles.checkboxGroup}>
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={formData.foodPreference.includes('Jain')}
                    onChange={() => handleFoodPreferenceChange('Jain')}
                    style={styles.checkboxInput}
                  />
                  <span style={styles.checkboxText}>Jain</span>
                </label>
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={formData.foodPreference.includes('Non-Jain')}
                    onChange={() => handleFoodPreferenceChange('Non-Jain')}
                    style={styles.checkboxInput}
                  />
                  <span style={styles.checkboxText}>Non-Jain</span>
                </label>
              </div>
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Category</label>
              <input
                type="text"
                style={styles.input}
                placeholder="Enter category eg.- VVIP, VIP, Delegate, Officer, Staff etc."
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
              />
            </div>
          </div>

          <div style={styles.fullWidth}>
            <label style={styles.label}>Additional Description</label>
            <textarea
              style={{ ...styles.input, ...styles.textArea }}
              placeholder="Enter additional details"
              rows={4}
              value={formData.additionalDescription}
              onChange={(e) => handleInputChange('additionalDescription', e.target.value)}
            />
          </div>

          <button style={styles.submitButton} onClick={handleSubmit}>
            SUBMIT
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: { [key: string]: CSSProperties } = {
  container: {
    minHeight: '100vh',
    width: '100vw',
    backgroundColor: '#fff',
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflowY: 'auto',
    margin: 0,
    padding: 0,
  },
  header: {
    backgroundColor: '#fff',
    borderBottom: '1px solid #e0e0e0',
  },
  headerTop: {
    backgroundColor: '#f5f5f5',
    padding: '8px 20px',
    textAlign: 'center',
    borderBottom: '1px solid #ddd',
  },
  headerText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    letterSpacing: '0.5px',
  },
  headerMain: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px 30px',
    backgroundColor: '#fff',
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: 15,
  },
  emblem: {
    width: 60,
    height: 60,
  },
  rajBhavanMarathi: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  rajBhavanEnglish: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  flag: {
    width: 80,
    height: 54,
    border: '1px solid #ddd',
    overflow: 'hidden',
  },
  flagOrange: {
    height: '33.33%',
    backgroundColor: '#FF9933',
  },
  flagWhite: {
    height: '33.33%',
    backgroundColor: '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  ashokChakra: {
    width: 12,
    height: 12,
    borderRadius: '50%',
    border: '2px solid #000080',
    position: 'relative',
  },
  flagGreen: {
    height: '33.33%',
    backgroundColor: '#138808',
  },
  navigation: {
    backgroundColor: '#FFA500',
    padding: '0',
    display: 'flex',
    justifyContent: 'flex-start',
    overflowX: 'auto',
  },
  navItem: {
    padding: '14px 24px',
    color: '#000',
    fontSize: 14,
    fontWeight: '500',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'background-color 0.2s',
  },
  formContainer: {
    backgroundColor: '#fff',
    padding: '40px 20px',
    minHeight: 'calc(100vh - 180px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  formCard: {
    backgroundColor: '#FFA500',
    borderRadius: 20,
    padding: 40,
    maxWidth: 1200,
    width: '100%',
    margin: '0 auto',
  },
  formTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    margin: '0 0 30px',
    letterSpacing: '1px',
  },
  row: {
    display: 'flex',
    gap: 20,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  fieldGroup: {
    flex: 1,
    minWidth: '250px',
  },
  fullWidth: {
    marginBottom: 20,
  },
  label: {
    display: 'block',
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  input: {
    width: '100%',
    backgroundColor: '#FFF8DC',
    borderRadius: 8,
    padding: '12px 14px',
    fontSize: 14,
    color: '#333',
    border: 'none',
    outline: 'none',
    boxSizing: 'border-box',
  },
  textArea: {
    minHeight: 100,
    resize: 'vertical',
    fontFamily: 'inherit',
  },
  submitButton: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: '14px 50px',
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
    border: 'none',
    cursor: 'pointer',
    marginTop: 10,
    float: 'right',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  radioGroup: {
    display: 'flex',
    gap: 20,
    backgroundColor: '#FFF8DC',
    padding: '12px 14px',
    borderRadius: 8,
  },
  radioLabel: {
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    gap: 8,
  },
  radioInput: {
    width: 18,
    height: 18,
    cursor: 'pointer',
  },
  radioText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
  },
  checkboxGroup: {
    display: 'flex',
    gap: 20,
    backgroundColor: '#FFF8DC',
    padding: '12px 14px',
    borderRadius: 8,
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    gap: 8,
  },
  checkboxInput: {
    width: 18,
    height: 18,
    cursor: 'pointer',
  },
  checkboxText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
  },
};