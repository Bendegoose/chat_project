import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AnimatePresence, motion } from "framer-motion";

import {
    Form,
    FormGroup,
    Label,
    Input,
    Button,
    Alert,
    Container,
    Row,
    Col,
    Card,
    CardBody
} from "reactstrap";


export default function Auth() {
    const [userData, setUserData] = useState({});
    const [error, setError] = useState(null);
    const [isRegistering, setIsRegistering] = useState(false);
    const [success, setSuccess] = useState(null);

    const { login, register, isAuthenticated, loading } = useAuth();
    const navigate = useNavigate();


    const onChange = (e) => {
        setUserData({
            ...userData,
            [e.target.id]: e.target.value
        });
    };


    async function handleSubmit(e) {
        e.preventDefault();
        setError(null);

        try {
            if (isRegistering) {
                const response = await fetch("/api/register", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(userData),
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error);
                } else {
                    setSuccess(data.success);
                }
            } else {
                await login(userData.username, userData.password);
                navigate('/');
            }

        } catch (err) {
            setError(err.message);
        }
    }


    if (loading) return <p>Betöltés...</p>;
    if (isAuthenticated) return <Navigate to="/" replace />;


    return (
        <div className="min-vh-100 d-flex align-items-center bg-dark">

            <Container>
                <Row className="justify-content-center">
                    <Col xs="12" md="6" lg="5">

                        <motion.div
                            layout
                            transition={{
                                layout: { duration: 0.35, ease: [0.22, 1, 0.36, 1] }
                            }}>

                            <Card className="shadow-lg border-0 rounded-4">
                                <motion.div layout>
                                    <CardBody className="p-4">
                                        <AnimatePresence mode="wait">
                                            <motion.h4
                                                key={isRegistering ? "register" : "login"}
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 10 }}
                                                transition={{ duration: 0.2 }}
                                                className="text-center mb-4 fw-bold"
                                            >
                                                {isRegistering ? "Register" : "Sign In"}
                                            </motion.h4>
                                        </AnimatePresence>

                                        <Form onSubmit={handleSubmit}>
                                            <FormGroup className="mb-3">
                                                <Label for="username">
                                                    Username
                                                </Label>

                                                <Input id="username" type="text" autoComplete="username" onChange={onChange} required />
                                            </FormGroup>
                                            <FormGroup className="mb-3">
                                                <Label for="password">
                                                    Password
                                                </Label>

                                                <Input id="password" type="password" autoComplete="current-password" onChange={onChange} required />

                                            </FormGroup>
                                            <motion.div
                                                layout
                                                initial={false}
                                                animate={{ height: isRegistering ? "auto" : 0, opacity: isRegistering ? 1 : 0 }}
                                                transition={{
                                                    height: { duration: 0.35, ease: "easeInOut" }, opacity: { duration: 0.2 }
                                                }}
                                                style={{ overflow: "hidden" }}>
                                                <FormGroup className="mb-3">
                                                    <Label for="inviteCode">
                                                        Invite Code
                                                    </Label>
                                                    <Input id="inviteCode" type="text" onChange={onChange} required={isRegistering} />
                                                </FormGroup>
                                            </motion.div>
                                            <motion.div layout>
                                                <Button color="primary" className="w-100" whilehover={{ scale: 1.02 }}>
                                                    {isRegistering ? "Register" : "Sign In"}
                                                </Button>
                                            </motion.div>
                                        </Form>

                                        {error && (
                                            <Alert color="danger" className="py-2 mt-3">
                                                {error}
                                            </Alert>
                                        )}
                                        {success && (
                                            <Alert color="success" className="py-2 mt-3">
                                                {success}
                                            </Alert>
                                        )}
                                        <AnimatePresence mode="wait">
                                            <motion.div
                                                key={isRegistering ? "login" : "register"}
                                                initial={{ opacity: 0, y: 8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -8 }}
                                                transition={{ duration: 0.2 }}
                                                className="text-center mt-4">
                                                <span className="text-primary" style={{ cursor: "pointer", textDecoration: "underline" }} onClick={() => setIsRegistering(!isRegistering)}>
                                                    {isRegistering ? "Back to Sign In" : "Got an Invite Code?"}
                                                </span>
                                            </motion.div>
                                        </AnimatePresence>
                                    </CardBody>
                                </motion.div>
                            </Card>
                        </motion.div>
                    </Col>
                </Row>
            </Container>
        </div>
    );
}