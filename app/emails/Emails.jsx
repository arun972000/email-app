"use client";

import React, { useEffect, useState } from "react";
import {
  Table,
  Badge,
  OverlayTrigger,
  Tooltip,
  Spinner,
  Pagination,
  Form,
  Row,
  Col,
  Button,
} from "react-bootstrap";
import axios from "axios";
import { FaSort, FaSortUp, FaSortDown } from "react-icons/fa";
import Link from "next/link";

const ITEMS_PER_PAGE = 20;

const EmailSubscriptionTable = () => {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("none");

  const fetchSubscribers = async () => {
    try {
      const response = await axios.get("/api/admin/emails");

      const result = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data.data)
          ? response.data.data
          : [];

      setSubscribers(result);
    } catch (err) {
      console.error("Failed to fetch subscribers:", err);
      setSubscribers([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (email) => {
    try {
      await axios.put(`/api/admin/emails/${email}`);
      setSubscribers((prev) =>
        prev.map((item) =>
          item.email === email ? { ...item, subscribe: item.subscribe ? 0 : 1 } : item
        )
      );
    } catch (err) {
      console.error("Toggle failed:", err);
    }
  };

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const handleSortToggle = () => {
    setSortOrder((prev) =>
      prev === "none" ? "asc" : prev === "asc" ? "desc" : "none"
    );
  };

  const filteredSubscribers = subscribers
    .filter((s) => s.email.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      if (sortOrder === "asc") return a.subscribe - b.subscribe;
      if (sortOrder === "desc") return b.subscribe - a.subscribe;
      return 0;
    });

  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentItems = filteredSubscribers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredSubscribers.length / ITEMS_PER_PAGE);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const renderPagination = () => {
    const items = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage < maxPagesToShow - 1) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    if (startPage > 1) {
      items.push(<Pagination.First key="first" onClick={() => handlePageChange(1)} />);
      items.push(<Pagination.Prev key="prev" onClick={() => handlePageChange(currentPage - 1)} />);
    }

    for (let number = startPage; number <= endPage; number++) {
      items.push(
        <Pagination.Item
          key={number}
          active={number === currentPage}
          onClick={() => handlePageChange(number)}
        >
          {number}
        </Pagination.Item>
      );
    }

    if (endPage < totalPages) {
      items.push(<Pagination.Next key="next" onClick={() => handlePageChange(currentPage + 1)} />);
      items.push(<Pagination.Last key="last" onClick={() => handlePageChange(totalPages)} />);
    }

    return <Pagination>{items}</Pagination>;
  };

  const activeCount = subscribers.filter((s) => s.subscribe === 1).length;
  const inactiveCount = subscribers.filter((s) => s.subscribe === 0).length;

  if (loading) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading subscribers...</p>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>Bulk Email Sender</h3>

        <Link href="/">
          <Button variant="secondary">← Back to Home</Button>
        </Link>
      </div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-3">Email Subscribers</h4>
        <Link href="/admin/upload-excel">
          <Button variant="primary">Upload Emails</Button>
        </Link>
      </div>
      <Row className="mb-3 align-items-center">
        <Col md={6}>
          <Form.Control
            type="text"
            placeholder="Search email..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </Col>
        <Col md={6} className="text-md-end mt-2 mt-md-0">
          <Badge bg="success" className="me-2">Active: {activeCount}</Badge>
          <Badge bg="secondary">Inactive: {inactiveCount}</Badge>
        </Col>
      </Row>

      <Table bordered hover responsive>
        <thead className="table-dark">
          <tr>
            <th>S.No</th>
            <th>Email</th>
            <th style={{ cursor: "pointer" }} onClick={handleSortToggle}>
              <OverlayTrigger
                placement="top"
                overlay={
                  <Tooltip>
                    Click to sort by status:{" "}
                    {sortOrder === "none"
                      ? "Active First"
                      : sortOrder === "asc"
                        ? "Inactive First"
                        : "No Sorting"}
                  </Tooltip>
                }
              >
                <span className="d-inline-flex align-items-center gap-1">
                  Subscribe{" "}
                  {sortOrder === "asc" && <FaSortDown />}
                  {sortOrder === "desc" && <FaSortUp />}
                  {sortOrder === "none" && <FaSort />}
                </span>
              </OverlayTrigger>
            </th>
          </tr>
        </thead>
        <tbody>
          {currentItems.length === 0 ? (
            <tr>
              <td colSpan={3} className="text-center">No matching subscribers found.</td>
            </tr>
          ) : (
            currentItems.map((subscriber, index) => {
              const isActive = subscriber.subscribe === 1;
              const badgeColor = isActive ? "success" : "secondary";
              const hoverMsg = isActive ? "Click to deactivate" : "Click to activate";

              return (
                <tr key={subscriber.email}>
                  <td>{indexOfFirstItem + index + 1}</td>
                  <td>{subscriber.email}</td>
                  <td>
                    <OverlayTrigger placement="top" overlay={<Tooltip>{hoverMsg}</Tooltip>}>
                      <Badge
                        bg={badgeColor}
                        style={{ cursor: "pointer", fontSize: "0.9rem" }}
                        onClick={() => toggleStatus(subscriber.email)}
                      >
                        {isActive ? "Active" : "Inactive"}
                      </Badge>
                    </OverlayTrigger>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </Table>

      {totalPages > 1 && (
        <div className="d-flex justify-content-center">{renderPagination()}</div>
      )}
    </div>
  );
};

export default EmailSubscriptionTable;
