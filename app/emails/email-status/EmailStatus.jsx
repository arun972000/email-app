'use client';
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { Button } from "react-bootstrap";

export default function EmailTrackingPage() {
    const today = new Date().toISOString().slice(0, 10);
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);

    const [fromDate, setFromDate] = useState(weekAgo);
    const [toDate, setToDate] = useState(today);
    const [records, setRecords] = useState([]);
    const [page, setPage] = useState(1);
    const [limit] = useState(25);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchRecords = async () => {
            setLoading(true);
            try {
                const res = await fetch(
                    `/api/admin/email-status?from=${fromDate}&to=${toDate}&page=${page}&limit=${limit}`
                );
                const data = await res.json();
                setRecords(data.records || []);
                setTotalPages(Math.ceil(data.total / limit));
            } catch (err) {
                console.error("Failed to fetch email records:", err);
                setRecords([]);
            } finally {
                setLoading(false);
            }
        };

        fetchRecords();
    }, [fromDate, toDate, page, limit]);

    const handlePrev = () => setPage((p) => Math.max(1, p - 1));
    const handleNext = () => setPage((p) => Math.min(totalPages, p + 1));

    return (
        <div className="container py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h3>Bulk Email Sender</h3>
                <Link href="/">
                    <Button variant="secondary">← Back to Home</Button>
                </Link>
            </div>
            <h2 className="mb-4">📨 Email Tracking Dashboard</h2>

            <div className="row mb-3">
                <div className="col-md-3">
                    <label className="form-label">From Date:</label>
                    <input
                        type="date"
                        value={fromDate}
                        className="form-control"
                        onChange={(e) => {
                            setFromDate(e.target.value);
                            setPage(1);
                        }}
                    />
                </div>
                <div className="col-md-3">
                    <label className="form-label">To Date:</label>
                    <input
                        type="date"
                        value={toDate}
                        className="form-control"
                        onChange={(e) => {
                            setToDate(e.target.value);
                            setPage(1);
                        }}
                    />
                </div>
            </div>

            {loading ? (
                <p>Loading...</p>
            ) : (
                <>
                    <table className="table table-bordered table-striped table-hover">
                        <thead className="table-light">
                            <tr>
                                <th>Email</th>
                                <th>Status</th>
                                <th>Subject</th>
                                <th>Link (if Clicked)</th>
                                <th>IP</th>
                                <th>Event Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            {records.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center">No records found</td>
                                </tr>
                            ) : (
                                records.map((r) => (
                                    <tr key={r.messageId}>
                                        <td>{r.email}</td>
                                        <td>
                                            <span className={`badge bg-${statusColor(r.status)}`}>
                                                {r.status}
                                            </span>
                                        </td>
                                        <td>{r.subject || "-"}</td>
                                        <td>
                                            {r.link ? (
                                                <a href={r.link} target="_blank" rel="noopener noreferrer">
                                                    {r.link.slice(0, 30)}...
                                                </a>
                                            ) : (
                                                "-"
                                            )}
                                        </td>
                                        <td>{r.ip || "-"}</td>
                                        <td>{r.eventTime ? new Date(r.eventTime).toLocaleString() : "-"}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>

                    <div className="d-flex justify-content-between align-items-center">
                        <button className="btn btn-secondary" onClick={handlePrev} disabled={page === 1}>
                            ← Prev
                        </button>
                        <span>Page {page} of {totalPages}</span>
                        <button className="btn btn-secondary" onClick={handleNext} disabled={page === totalPages}>
                            Next →
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}

function statusColor(status) {
    switch (status) {
        case "Click": return "success";
        case "Open": return "info";
        case "Delivery": return "primary";
        case "Bounce": return "danger";
        case "Complaint": return "warning";
        case "Send": return "secondary";
        case "Reject": return "dark";
        default: return "secondary";
    }
}
