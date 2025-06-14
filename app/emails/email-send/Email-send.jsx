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
} from "react-bootstrap";
import axios from "axios";
import Link from "next/link";

const BulkEmailSender = () => {
  const [subject, setSubject] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [sent, setSent] = useState(false);
  const [testSent, setTestSent] = useState(false);
  const [error, setError] = useState("");
  const [testError, setTestError] = useState("");
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [testRecipient, setTestRecipient] = useState("");

  // New: Subscribers
  const [subscribers, setSubscribers] = useState([]);
  const [subscribedCount, setSubscribedCount] = useState(0);
  const [unsubscribedCount, setUnsubscribedCount] = useState(0);
  const [loadingSubs, setLoadingSubs] = useState(true);

  useEffect(() => {
    const fetchSubscribers = async () => {
      try {
        const response = await axios.get("/api/admin/emails");

        const result = Array.isArray(response.data)
          ? response.data
          : Array.isArray(response.data.data)
            ? response.data.data
            : [];

        setSubscribers(result);

        const subscribed = result.filter((s) => s.subscribe !== 0);
        const unsubscribed = result.filter((s) => s.subscribe === 0);

        setSubscribedCount(subscribed.length);
        setUnsubscribedCount(unsubscribed.length);
      } catch (err) {
        console.error("Failed to fetch subscribers:", err);
      } finally {
        setLoadingSubs(false);
      }
    };

    fetchSubscribers();
  }, []);

  const handleSend = async () => {
    setLoading(true);
    setSent(false);
    setError("");

    try {
      const res = await axios.post("/api/admin/email-send", {
        subject,
        message: htmlContent,
      });

      if (res.status === 200 && res.data.success) {
        setSent(true);
        setHtmlContent("");
        setSubject("");
      } else {
        setError(res.data.error || "Failed to send emails.");
      }
    } catch (err) {
      console.error("Bulk send error:", err);
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

      if (res.status === 200 && res.data.success) {
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

  return (
    <Container className="mt-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>Bulk Email Sender</h3>
        <Link href="/">
          <Button variant="secondary">← Back to Home</Button>
        </Link>
      </div>

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

      <Row>
        {/* Bulk Mail Panel */}
        <Col md={6}>
          <Card className="mb-4">
            <Card.Body>
              <Form>
                <Form.Group className="mb-3" controlId="subject">
                  <Form.Label>Email Subject</Form.Label>
                  <Form.Control
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Enter email subject"
                  />
                </Form.Group>

                <Form.Group controlId="htmlContent">
                  <Form.Label>Paste HTML Content</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={5}
                    value={htmlContent}
                    onChange={(e) => setHtmlContent(e.target.value)}
                    placeholder="<h1>Hello!</h1><p>This is a bulk email...</p>"
                  />
                </Form.Group>

                <div className="d-grid gap-2 mt-3">
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleSend}
                    disabled={!htmlContent.trim() || !subject.trim() || loading}
                  >
                    {loading ? (
                      <Spinner animation="border" size="sm" />
                    ) : (
                      "Send Bulk Email"
                    )}
                  </Button>
                </div>

                {sent && (
                  <Alert variant="success" className="mt-3">
                    Bulk email sent successfully!
                  </Alert>
                )}
                {error && (
                  <Alert variant="danger" className="mt-3">
                    {error}
                  </Alert>
                )}
              </Form>
            </Card.Body>
          </Card>

          {/* Test Email Panel */}
          <Card>
            <Card.Body>
              <Form>
                <Form.Group className="mb-3" controlId="testEmail">
                  <Form.Label>Test Email Recipient</Form.Label>
                  <Form.Control
                    type="email"
                    value={testRecipient}
                    onChange={(e) => setTestRecipient(e.target.value)}
                    placeholder="Enter recipient email"
                  />
                </Form.Group>

                <div className="d-grid gap-2">
                  <Button
                    variant="warning"
                    onClick={handleTestSend}
                    disabled={
                      !testRecipient.trim() ||
                      !htmlContent.trim() ||
                      !subject.trim() ||
                      testLoading
                    }
                  >
                    {testLoading ? (
                      <Spinner animation="border" size="sm" />
                    ) : (
                      "Send Test Email"
                    )}
                  </Button>
                </div>

                {testSent && (
                  <Alert variant="success" className="mt-3">
                    Test email sent successfully!
                  </Alert>
                )}
                {testError && (
                  <Alert variant="danger" className="mt-3">
                    {testError}
                  </Alert>
                )}
              </Form>
            </Card.Body>
          </Card>
        </Col>

        {/* Desktop Preview */}
        <Col md={6}>
          <h6 className="text-muted mb-2">Email Preview</h6>
          <div
            style={{
              width: "100%",
              height: "600px",
              overflow: "auto",
              border: "1px solid #ccc",
              backgroundColor: "#f9f9f9",
              padding: "0.5rem",
            }}
          >
            <div
              style={{
                width: "700px",
                margin: "0 auto",
                backgroundColor: "white",
                boxShadow: "0 0 3px rgba(0,0,0,0.1)",
                padding: "1rem",
                minHeight: "100%",
              }}
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default BulkEmailSender;
