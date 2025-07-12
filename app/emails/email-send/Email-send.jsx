"use client";

import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Button,
  Form,
  Alert,
  Spinner,
  Card,
  Modal,
  Tab,
  Tabs,
} from "react-bootstrap";
import axios from "axios";
import Link from "next/link";

const BulkEmailSender = () => {
  const [subject, setSubject] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [subscribers, setSubscribers] = useState([]);
  const [subscribedCount, setSubscribedCount] = useState(0);
  const [unsubscribedCount, setUnsubscribedCount] = useState(0);
  const [loadingSubs, setLoadingSubs] = useState(true);

  const [testRecipient, setTestRecipient] = useState("");
  const [testLoading, setTestLoading] = useState(false);
  const [testSent, setTestSent] = useState(false);
  const [testError, setTestError] = useState("");

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const [activeTab, setActiveTab] = useState("subscribers");
  const [excelFile, setExcelFile] = useState(null);
  const [excelSendStatus, setExcelSendStatus] = useState(null);
  const [excelError, setExcelError] = useState(null);
  const [excelLoading, setExcelLoading] = useState(false);

  const STATIC_PASSWORD = "raceauto@123";

  useEffect(() => {
    const fetchSubscribers = async () => {
      try {
        const res = await axios.get("/api/admin/emails");
        const data = Array.isArray(res.data) ? res.data : res.data.data || [];

        setSubscribers(data);
        setSubscribedCount(data.filter((s) => s.subscribe !== 0).length);
        setUnsubscribedCount(data.filter((s) => s.subscribe === 0).length);
      } catch (err) {
        console.error("Failed to fetch subscribers:", err);
      } finally {
        setLoadingSubs(false);
      }
    };

    fetchSubscribers();
  }, []);

  const handleSend = async () => {
    setPasswordInput("");
    setPasswordError("");
    setShowPasswordModal(true);
  };

  const confirmPasswordAndSend = async () => {
    if (passwordInput !== STATIC_PASSWORD) {
      setPasswordError("Incorrect password");
      return;
    }

    setShowPasswordModal(false);
    setLoading(true);
    setSent(false);
    setError("");

    try {
      const res = await axios.post("/api/admin/email-send", {
        subject,
        message: htmlContent,
      });

      if (res.data.success) {
        setSent(true);
        setSubject("");
        setHtmlContent("");
      } else {
        setError(res.data.error || "Failed to send emails.");
      }
    } catch (err) {
      console.error("Send error:", err);
      setError(err.response?.data?.error || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleTestSend = async () => {
    setTestLoading(true);
    setTestSent(false);
    setTestError("");

    try {
      const res = await axios.post("/api/admin/email-send/test-email", {
        recipient: testRecipient,
        subject,
        message: htmlContent,
      });

      if (res.data.success) {
        setTestSent(true);
      } else {
        setTestError(res.data.error || "Failed to send test email.");
      }
    } catch (err) {
      console.error("Test email error:", err);
      setTestError(err.response?.data?.error || "Something went wrong.");
    } finally {
      setTestLoading(false);
    }
  };

  const handleExcelUpload = async () => {
    if (!excelFile || !subject || !htmlContent) return;

    setExcelLoading(true);
    setExcelSendStatus(null);
    setExcelError(null);

    try {
      const formData = new FormData();
      formData.append("file", excelFile);
      formData.append("subject", subject);
      formData.append("message", htmlContent);

      const res = await axios.post("/api/admin/email-send/excel", formData);

      if (res.data.success) {
        setExcelSendStatus(res.data.message);
        setExcelFile(null);
      } else {
        setExcelError(res.data.error || "Failed to send Excel emails.");
      }
    } catch (err) {
      console.error("Excel send error:", err);
      setExcelError(err.response?.data?.error || "Something went wrong.");
    } finally {
      setExcelLoading(false);
    }
  };

  return (
    <Container className="mt-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>📤 Bulk Email Sender</h3>
        <div className="d-flex gap-2">
          <Link href="/emails/email-status">
            <Button variant="info">📊 Track Email Status</Button>
          </Link>
          <Link href="/emails">
            <Button variant="secondary">👥 Manage Subscribers</Button>
          </Link>
        </div>
      </div>

      <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-4">
        <Tab eventKey="subscribers" title="📬 Send to Subscribers">
          {/* original send UI retained here */}
          <Row className="mb-4">
            <Col md={12}>
              <Card>
                <Card.Body>
                  <h5>Subscribers Info</h5>
                  {loadingSubs ? (
                    <Spinner animation="border" />
                  ) : (
                    <>
                      <p>✅ Subscribed: <strong>{subscribedCount}</strong></p>
                      <p>❌ Unsubscribed: <strong>{unsubscribedCount}</strong></p>
                      <p>📧 Total: <strong>{subscribers.length}</strong></p>
                    </>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>

        <Tab eventKey="excel" title="📑 Send via Excel Upload">
          <Card className="mb-4">
            <Card.Body>
              <Form.Group className="mb-3">
                <Form.Label>Upload Excel File</Form.Label>
                <Form.Control type="file" accept=".xlsx,.xls" onChange={(e) => setExcelFile(e.target.files[0])} />
                <Form.Text className="text-muted">
                  ⚠️ Excel file should have a column named <strong>email</strong>, <strong>Email</strong>, or <strong>Email Address</strong>.
                </Form.Text>
              </Form.Group>

              <Button
                variant="success"
                onClick={handleExcelUpload}
                disabled={!excelFile || !subject || !htmlContent || excelLoading}
              >
                {excelLoading ? "Sending..." : "Send Emails from Excel"}
              </Button>
              {excelSendStatus && <Alert variant="success" className="mt-3">✅ {excelSendStatus}</Alert>}
              {excelError && <Alert variant="danger" className="mt-3">❌ {excelError}</Alert>}
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>

      <Row>
        <Col md={6}>
          <Card className="mb-4">
            <Card.Body>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Email Subject</Form.Label>
                  <Form.Control
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Enter subject"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>HTML Content</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={6}
                    value={htmlContent}
                    onChange={(e) => setHtmlContent(e.target.value)}
                    placeholder="<h1>Hello</h1><p>Your message</p>"
                  />
                </Form.Group>

                <Button
                  variant="primary"
                  size="lg"
                  disabled={!subject || !htmlContent || loading}
                  onClick={handleSend}
                >
                  {loading ? (
                    <Spinner size="sm" animation="border" />
                  ) : (
                    "Send Bulk Email"
                  )}
                </Button>

                {sent && (
                  <Alert variant="success" className="mt-3">
                    ✅ All emails sent successfully!
                  </Alert>
                )}
                {error && (
                  <Alert variant="danger" className="mt-3">
                    ❌ {error}
                  </Alert>
                )}
              </Form>
            </Card.Body>
          </Card>

          <Card>
            <Card.Body>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Test Email Recipient</Form.Label>
                  <Form.Control
                    type="email"
                    value={testRecipient}
                    onChange={(e) => setTestRecipient(e.target.value)}
                    placeholder="example@example.com"
                  />
                </Form.Group>

                <Button
                  variant="warning"
                  disabled={!testRecipient || !subject || !htmlContent || testLoading}
                  onClick={handleTestSend}
                >
                  {testLoading ? "Sending..." : "Send Test Email"}
                </Button>

                {testSent && (
                  <Alert variant="success" className="mt-3">
                    ✅ Test email sent!
                  </Alert>
                )}
                {testError && (
                  <Alert variant="danger" className="mt-3">
                    ❌ {testError}
                  </Alert>
                )}
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <h6 className="text-muted mb-2">Email Preview</h6>
          <div
            style={{
              height: "600px",
              overflow: "auto",
              border: "1px solid #ccc",
              background: "#f9f9f9",
              padding: "0.5rem",
            }}
          >
            <div
              style={{
                width: "700px",
                background: "white",
                margin: "0 auto",
                padding: "1rem",
                boxShadow: "0 0 3px rgba(0,0,0,0.1)",
              }}
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          </div>
        </Col>
      </Row>

      {/* 🔐 Password Modal */}
      <Modal show={showPasswordModal} onHide={() => setShowPasswordModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>🔐 Confirm Admin Password</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Enter Password</Form.Label>
            <Form.Control
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="Enter admin password"
            />
            {passwordError && (
              <div className="text-danger mt-2">{passwordError}</div>
            )}
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPasswordModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={confirmPasswordAndSend}>
            Confirm & Send
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default BulkEmailSender;