import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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
    CardBody,
    CardTitle
} from "reactstrap";

export default function Register() {
    const [userData, setUserData] = useState({})
    const [error, setError] = useState(null);
    const { isAuthenticated, loading } = useAuth();
    const navigate = useNavigate();

    const onChange = (e) => setUserData({
        ...userData,
        [e.target.id]: e.target.value
    })

    async function handleRegister(e) {
        e.preventDefault();
        setError(null);

        try {
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
            }

            navigate('/login');
        } catch (err) {
            setError(err.message);
        }
    }

    if (loading) return <p>Betöltés...</p>;
    if (isAuthenticated) return <Navigate to="/" replace />;

    return (
        <div>
            <Container>
                <Row>
                    <Col xs="12" md="6" lg="5">
                        <Card>
                            <CardBody>
                                <CardTitle>
                                    Register
                                </CardTitle>

                                <Form onSubmit={handleRegister}>
                                    <FormGroup>
                                        <Label for="username">Username</Label>
                                        <Input id="username" type="text" autoComplete="username" onChange={onChange} required />
                                    </FormGroup>

                                    <FormGroup>
                                        <Label for="password">Password</Label>
                                        <Input id="password" type="password" autoComplete="current-password" onChange={onChange} required/>
                                    </FormGroup>

                                    <FormGroup>
                                        <Label for="password">Invite Code</Label>
                                        <Input id="password" type="text" onChange={onChange} required/>
                                    </FormGroup>

                                    {error && (
                                        <Alert>
                                            {error}
                                        </Alert>
                                    )}

                                    <Button>
                                        Register
                                    </Button>
                                </Form>
                                <div>
                                    <span onClick={() => navigate("/login")} style={{ cursor: "pointer", textDecoration: "underline" }}>
                                        Log In
                                    </span>
                                </div>
                            </CardBody>
                        </Card>
                    </Col>

                </Row>
            </Container>
        </div>
    );
}
